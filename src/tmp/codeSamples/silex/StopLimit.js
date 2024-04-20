import { numberToString, capitalize } from '@/lib/utils'
import AbstractBot from './AbstractBot'

export default class StopLimit extends AbstractBot {
	limitUp = null
	limitDown = null
	lossTolerance = null

	static type = 'Stop Limit'
	static description = 'Stop limit orders with limit up and limit down'
	static longDescription = 'Buy if price goes to z + <limit up>%, also sell if price goes to z + <limit down>%'
	static metadataInfo = Object.assign({}, AbstractBot.metadataInfo, {
		limitUp: {
			label: 'Limit up',
			description: 'Percent change to trigger a sell order. Leave empty to ignore',
			default: 25,
			type: 'number',
			validation: { min_value: 0 },
		},
		limitDown: {
			label: 'Limit down',
			description: 'Percent change to trigger a sell order. Leave empty to ignore',
			default: -5,
			type: 'number',
			validation: { max_value: 0 },
		},
		lossTolerance: {
			label: 'Loss tolerance',
			description: 'Optional. If the price drops more than than x% under the limit down, don\'t execute the trade',
			default: null,
			type: 'number',
			validation: { min_value: 0 },
		},
	})
	constructor(params) {
		super(params)
		this.limitDown = params.limitDown || StopLimit.metadataInfo.limitDown.default
		this.limitUp = params.limitUp || StopLimit.metadataInfo.limitUp.default
		this.lossTolerance = params.lossTolerance || StopLimit.metadataInfo.lossTolerance.default
	}
	async init(params) {
		this.isFirstTime = true
		return await super.init(params)
	}
	setLimitPrices(price) {
		this.limitUpPrice = price + price * this.limitUp / 100
		this.limitDownPrice = price + price * this.limitDown / 100
	}
	get limitDownMessage() {
		return this.limitDown && `limit down: ${numberToString(this.limitDownPrice)} ${this.ref}`
	}
	get limitUpMessage() {
		return this.limitUp && `limit up: ${numberToString(this.limitUpPrice)} ${this.ref}`
	}
	async process(price) {
		const currentPriceMessage = `Current ${this.side} price: ${numberToString(price)} ${this.ref}`
		if (this.isFirstTime) {
			this.setLimitPrices(price)
			this.message({ message: capitalize(this.limitDownMessage, true)})
			this.message({ message: capitalize(this.limitUpMessage, true)})
			this.isFirstTime = false
		}
		if (this.limitUpPrice && price >= this.limitUpPrice) {
			this.done(`Limit price up reached: ${currentPriceMessage}. ${this.limitUpMessage}`)
		} else if (this.limitDownPrice && price <= this.limitDownPrice) {
			if (this.lossTolerance) {
				const distanceToLimitDown = 1 - price/this.limitDownPrice
				const message = `We are ${numberToString(100 * distanceToLimitDown)}% under the limit down, and the loss tolerance is set to ${numberToStringthis.lossTolerance}%`
				if (distanceToLimitDown > this.lossTolerance / 100) {
					this.message({type: 'tmp', tmpKey: 'Limit down reached', message: `Limit down reached, but price dropped to quickly. ${message}. ${capitalize(currentPriceMessage, true)}. ${capitalize(this.limitDownMessage, true)}`})
					return
				} else {
					this.message({ message: `Limit down reached within tolerance. ${message}`})
				}
			} 
			this.done(`Limit price down reached: ${currentPriceMessage}. ${this.limitDownMessage}`)
		} else {
			this.message({ type: 'tmp', tmpKey: `Current price: `, message: `${capitalize(currentPriceMessage, true)}, ${this.limitUpMessage}, ${this.limitDownMessage}` })
		}
	}
	async done(message) {
		this.message({ message })
		await this.trade(this.side, {
			ref: this.ref,
			amount: this.amount,
			currency: this.targetCurrency,
		})
		this.message({ done: true })
	}
	asJSON() {
		return Object.assign(super.asJSON(), {
			limitDown: this.limitDown,
			limitUp: this.limitUp,
			lossTolerance: this.lossTolerance,
		})
	}
}