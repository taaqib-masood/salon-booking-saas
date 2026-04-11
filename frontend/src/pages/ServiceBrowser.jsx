import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ServiceBrowser() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    axios.get('/api/v1/categories').then((response) => setCategories(response.data));
    axios.get('/api/v1/services').then((response) => setServices(response.data));
  }, []);

  const filteredServices = services.filter((service) => {
    return (
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedCategory || service.category === selectedCategory)
    );
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
        <option value="">All</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      {filteredServices.map((service) => (
        <div key={service.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '0.5rem 0' }}>
          <h2>{service.name}</h2>
          <p>Price: {service.price} AED</p>
          <p>Duration: {service.duration} minutes</p>
          <button onClick={() => alert('Book Now')}>Book Now</button>
        </div>
      ))}
    </div>
  );
}

export default ServiceBrowser;
