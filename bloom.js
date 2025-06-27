import bloomFilter from "bloom-filters"; 

const filter = new bloomFilter.BloomFilter(10000, 4);  



export default filter; 