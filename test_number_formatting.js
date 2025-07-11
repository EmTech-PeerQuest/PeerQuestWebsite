// Test the number formatting function
function formatLargeNumber(num) {
  if (num >= 1000000) {
    const millions = Math.floor(num / 100000) / 10; // This gives us 1 decimal place without rounding up
    return millions % 1 === 0 ? millions.toString() + 'M' : millions.toFixed(1) + 'M';
  }
  if (num >= 10000) {
    const thousands = Math.floor(num / 100) / 10; // This gives us 1 decimal place without rounding up
    return thousands % 1 === 0 ? thousands.toString() + 'k' : thousands.toFixed(1) + 'k';
  }
  return num.toLocaleString();
}

// Test cases
console.log('Testing formatLargeNumber function:');
console.log('1000 =>', formatLargeNumber(1000));      // "1,000"
console.log('5000 =>', formatLargeNumber(5000));      // "5,000"
console.log('9999 =>', formatLargeNumber(9999));      // "9,999"
console.log('10000 =>', formatLargeNumber(10000));    // "10k"
console.log('10100 =>', formatLargeNumber(10100));    // "10.1k"
console.log('15000 =>', formatLargeNumber(15000));    // "15k"
console.log('25500 =>', formatLargeNumber(25500));    // "25.5k"
console.log('100000 =>', formatLargeNumber(100000));  // "100k"
console.log('1000000 =>', formatLargeNumber(1000000)); // "1M"
console.log('1250000 =>', formatLargeNumber(1250000)); // "1.3M"
console.log('10000000 =>', formatLargeNumber(10000000)); // "10M"
