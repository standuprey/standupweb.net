const redisClient = require("./redisClient")
const OUTFIT_MAX_COUNT = 180
const STYLE_THIS_OUTFIT_MAX_COUNT = 1800

function getKey(name) {
  return `hashtag:${name.toLowerCase().replace(/#|\s/g, '')}`
}

module.exports = {
  getKey,
  async parse(text, outfitId, weight = 1) {
    if (!(text && outfitId)) {
      return
    }
    let hashtags = text.match(/#\w+/g)
    if (!hashtags) { return }
    await Promise.all(hashtags.map(hashtag => this.add(hashtag.replace(/^#/, ''), outfitId, weight)))
  },
  async add(name, outfitId, weight) {
    outfitId = outfitId.toString()
    const key = getKey(name)
    const checkSize = Math.random() * 10
    if (checkSize > 9) {
      const size = await redisClient.zcard(key)
      const sizeLimit = /stylethis/i.test(name) ? STYLE_THIS_OUTFIT_MAX_COUNT : OUTFIT_MAX_COUNT
      if (size > sizeLimit) {
        await redisClient.zremrangebyrank(key, 0, -sizeLimit)
      }
    }
    const score = weight + parseInt((await redisClient.zscore(key, outfitId)) || 0, 10)
    await redisClient.zadd(key, score, outfitId)
  },
  async remove(name) {
    await redisClient.del(getKey(name))
  },
  async find(name) {
    const keys = await redisClient.keys(getKey(`${name}*`))
    let result = []
    for (const key of keys) {
      outfitWithScores = await redisClient.zrevrangebyscore(key, `+inf`, 0, `WITHSCORES`)
      let odd = true
      outfitWithScores = outfitWithScores
        .reduce((acc, value) => {
          if (odd) {
            acc.keys.push(value)
          } else {
            acc.values.push(value)
          }
          odd = !odd
          return acc
        }, { keys: [], values: []})
      outfitWithScores = outfitWithScores.keys
        .map((k, i) => ({
          key: k,
          value: parseInt(outfitWithScores.values[i], 10)
        }))
      result = result.concat(outfitWithScores)
    }
    return result.sort((a, b) => b.value - a.value).map(o => o.key)
  }
}
