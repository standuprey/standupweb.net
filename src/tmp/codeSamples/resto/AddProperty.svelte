<script>
  import Datepicker from 'svelte-calendar'
  import { DateTime } from 'luxon'
  import { navigateTo } from 'svelte-router-spa'
  import { notifier } from '@beyonk/svelte-notifications'
  import { gql } from 'apollo-boost'
  import LoadButton from '../components/LoadButton.svelte'
  import { client } from '../lib/data'; 

  let name, property_value, symbol, street, city, state, isLoading, tokenSaleStartDate, tokenSaleEndDate, tokenSaleStartDateChosen, tokenSaleEndDateChosen
	let dollar_value = 0.1

  async function submit(){
    let response
    if (!checkValid()) {
      return
    }
    isLoading = true
		const amount = property_value / dollar_value
    try {
      response = await client.mutate({
        mutation: gql`
          mutation PropertyAdd($symbol: String!, $amount: Int!, $name: String!, $street: String!, $city: String!, $state: String!, $token_sale_start: String!, $token_sale_end: String!, $dollar_value: Float!) {
            propertyAdd(symbol: $symbol, amount: $amount, name: $name, street: $street, city: $city, state: $state, token_sale_end: $token_sale_end, token_sale_start: $token_sale_start, dollar_value: $dollar_value) {
              id block_num block_time error_code
            }
          }`,
        variables: { name, amount, symbol, street, state, city, token_sale_end, token_sale_start, dollar_value },
      })
    } catch (err) {
      console.error(err)
      response = { error: err.message }
    }
    isLoading = false
    if (response.error) {
      notifier.danger(`Property creation failed: ${response.error}`)
    } else {
      notifier.info('Property created!')
      navigateTo('/offerings')
    }
  }

  function checkValid() {
    let valid = true
    if (!tokenSaleStartDateChosen) {
      notifier.danger('Please pick a token sale start date')
      valid = false
    }
    if (!tokenSaleEndDateChosen) {
      notifier.danger('Please pick a token sale end date')
      valid = false
    }
    if (valid && dateTimeStart > dateTimeEnd) {
      notifier.danger('Token sale start date must be before the end date')
      valid = false
    }
    return valid
  }

  $: dateTimeStart = DateTime.fromJSDate(tokenSaleStartDate)
  $: dateTimeEnd = DateTime.fromJSDate(tokenSaleEndDate)
  $: formatStart = dateTimeStart.toFormat('LL/dd/yy')
  $: formatEnd = dateTimeEnd.toFormat('LL/dd/yy')
  $: token_sale_start = dateTimeStart.toFormat("yyyy-LL-dd")
  $: token_sale_end = dateTimeEnd.toFormat("yyyy-LL-dd")
</script>
<div class="component">
  <h2>Add Property</h2>
  <form on:submit|stopPropagation|preventDefault={submit}>
    <div class="field">
      <label>property name</label>
      <input
        required
        type="text"
        name="symbol"
        placeholder="Enter property name"
        bind:value={name}
      />
    </div>
    <div class="field">
      <label>token symbol</label>
      <input
        required
        type="text"
        name="symbol"
        placeholder="Enter symbol"
        bind:value={symbol}
      />
    </div>
    <div class="field">
      <label>property value (USD)</label>
      <input
        required
        type="number"
        name="property_value"
        placeholder="Property value"
        bind:value={property_value}
      />
    </div>
    <div class="field">
      <label>token value (USD)</label>
      <input
        required
        type="number"
        name="dollar_value"
        step="0.0001"
        placeholder="token value"
        bind:value={dollar_value}
      />
    </div>
    <div class="field">
      <label>street</label>
      <input
        required
        type="text"
        name="street"
        placeholder="Enter street address"
        bind:value={street}
      />
    </div>
    <div class="field">
      <label>city</label>
      <input
        required
        type="text"
        name="city"
        placeholder="Enter city"
        bind:value={city}
      />
    </div>
    <div class="field">
      <label>state</label>
      <input
        required
        type="text"
        name="state"
        placeholder="Enter state"
        bind:value={state}
      />
    </div>
    <Datepicker
      bind:selected={tokenSaleStartDate}
      bind:dateChosen={tokenSaleStartDateChosen}
    >
      <div class='button picker'>
        {#if tokenSaleStartDateChosen} Token sale start: {formatStart} {:else} Pick a token sale start date {/if}
      </div>
    </Datepicker>
    <Datepicker
      bind:selected={tokenSaleEndDate}
      bind:dateChosen={tokenSaleEndDateChosen}
    >
      <div class='button picker'>
        {#if tokenSaleEndDateChosen} Token sale ends: {formatEnd} {:else} Pick a token sale end date {/if}
      </div>
    </Datepicker>
    <div class="actions">
      <LoadButton css="main left" label="Submit" isLoading={isLoading}/>
      <a href="/offerings" class="button right">Cancel</a>
    </div>
  </form>
</div>
<style lang="scss">
  @import "style/theme.scss";
  .component {
    max-width: 300px;
    margin: 0 auto;
    color: $white;
		:global(.datepicker) {
			display: block;
			margin: 20px 0;
		}
  }
  input {
    max-width: 300px;
  }
  .actions {
    overflow: hidden;
    position: relative;
    margin-bottom: 20px;
  }
  .button.picker {
    width: 100%;
    padding: 10px 0;
  }
</style>
