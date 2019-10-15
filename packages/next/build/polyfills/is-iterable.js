export default obj => obj != null && typeof obj[Symbol.iterator] === 'function'
