export const phoneNumberValidator = (phone) => {
  // Nettoie: retire espaces, tirets, indicatif +224 ou 00224
  const cleaned = phone
    .replace(/[\s-]/g, "")         
    .replace(/^(\+224|00224)/, "");

  const regex = /^(620|621|622|623|624|625|626|627|628|629|610|611|612|613|660|661|662|663|664|665|666|667|668|669|654|655|656|657)\d{6}$/;

  return regex.test(cleaned);
};

export const formatPhoneNumber = (phone) => {
  const cleaned = phone
    .replace(/[\s-]/g, "")
    .replace(/^(\+224|00224)/, "");

  return cleaned;
};