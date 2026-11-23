// Display-only price helpers. The server calculates the real price at checkout.
export function defaultOptions(product) {
  const chosen = {};
  (product.optionGroups || []).forEach((g) => { chosen[g.key] = g.choices[0].value; });
  return chosen;
}

export function priceFor(product, options = {}) {
  const extras = (product.optionGroups || []).reduce((sum, group) => {
    const choice = group.choices.find((c) => c.value === (options[group.key] ?? group.choices[0].value));
    return sum + (choice ? choice.priceDelta : 0);
  }, 0);
  return product.price + extras;
}
