import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

function ServiceBrowser() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    axios.get('/api/v1/categories').then((response) => setCategories(response.data));
    axios.get('/api/v1/services').then((response) => setServices(response.data));
  }, []);

  const handleSearch = (event) => setSearchTerm(event.target.value);
  const handleCategoryChange = (event) => setSelectedCategory(event.target.value);

  const filteredServices = services.filter((service) => {
    return (
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedCategory || service.category === selectedCategory)
    );
  });

  return (
    <div>
      <TextField label="Search" value={searchTerm} onChange={handleSearch} />
      <select value={selectedCategory} onChange={handleCategoryChange}>
        <option value="">All</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      {filteredServices.map((service) => (
        <Card
          key={service.id}
          sx={{ minWidth: 275, direction: language === 'ar' ? 'rtl' : 'ltr', mb: 1 }}
        >
          <CardContent>
            <Typography variant="h5" component="h2">
              {service.name}
            </Typography>
            <Typography color="text.secondary">
              Price: {service.price} AED
            </Typography>
            <Typography color="text.secondary">
              Duration: {service.duration} minutes
            </Typography>
          </CardContent>
          <Button variant="contained" color="primary" onClick={() => alert('Book Now')}>
            Book Now
          </Button>
        </Card>
      ))}
    </div>
  );
}

export default ServiceBrowser;
