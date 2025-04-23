const axios = require('axios');
require('dotenv').config();

const storeName = process.env.SHOPIFY_STORE_NAME;
const apiVersion = process.env.SHOPIFY_API_VERSION;
const apiUrl = `https://${storeName}.myshopify.com/admin/api/${apiVersion}/products.json`;

const getProducts = async (query = '', queryType = '') => {
    try {
        let url = apiUrl;
        const params = {};
    
        if (queryType === 'title' && query) {
              params.title = query;
        }
            
        const response = await axios.get(url, {
            headers: {
              'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
            },
             params: params,
        });
    
        let products = response.data.products;
    
        if (queryType === 'id' && query) {
            products = products.filter(product => product.id === parseInt(query));
        }
        
         if (queryType === 'title' && query) {
          products = products.filter(product =>
          product.title.toLowerCase().includes(query.toLowerCase())
          );
        }  
      return products.map(product => ({
          id: product.id,
          title: product.title,
        }));
      } 
        catch (error) {
        console.error('Error fetching products from Shopify:', error.response ? error.response.data : error.message);
        throw new Error('Error fetching products from Shopify');
      }
    };
  
  module.exports = { getProducts };