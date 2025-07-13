/**
 * Türkiye Cumhuriyeti Kimlik Numarası doğrulama
 * TC Kimlik numarası 11 haneli olmalı, ilk hane 0 olmamalı ve son hane algoritma kontrolünden geçmeli
 * @param tcNumber TC Kimlik numarası
 * @returns Geçerli ise true, değilse false
 */
export const validateTCNumber = (tcNumber: string): boolean => {
  // Uzunluk kontrolü ve ilk hane sıfır olmamalı
  if (tcNumber.length !== 11 || tcNumber[0] === '0' || !/^\d+$/.test(tcNumber)) {
    return false;
  }
  
  // İlk 10 hanenin toplamının mod 10'u son haneye eşit olmalı
  const digits = tcNumber.split('').map(Number);
  const sum = digits.slice(0, 10).reduce((acc, digit) => acc + digit, 0);
  
  return (sum % 10) === digits[10];
};

/**
 * Vergi Numarası doğrulama
 * Vergi numarası 10 haneli olmalı ve tüm karakterler rakam olmalı
 * @param taxNumber Vergi numarası
 * @returns Geçerli ise true, değilse false
 */
export const validateTaxNumber = (taxNumber: string): boolean => {
  return taxNumber.length === 10 && /^\d+$/.test(taxNumber);
};
