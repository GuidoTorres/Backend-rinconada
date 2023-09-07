const cloudinary = require("cloudinary").v2


cloudinary.config({ 
    cloud_name: 'drsbq4can', 
    api_key: '612568639618476', 
    api_secret: 'kmnwje-2UUHxV2xff6uUrWR58fM' 
  });


  module.exports = {cloudinary}