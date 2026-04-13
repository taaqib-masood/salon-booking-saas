import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  root: {
    minWidth: 275,
    direction: (props) => props.language === 'ar' ? 'rtl' : 'ltr',
  },
});

function ServiceBrowser() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const classes = useStyles();

  useEffect(() => {
    axios.get('/api/v1/categories')
      .then((response) => {
        setCategories(response.data);
      });

    axios.get('/api/v1/services')
      .then((response) => {
        setServices(response.data);
      });
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const filteredServices = services.filter((service) => {
    return service.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedCategory || service.category === selectedCategory);
  });

  return (
    <div>
      <TextField label="Search" value={searchTerm} onChange={handleSearch} />
      <select value={selectedCategory} onChange={handleCategoryChange}>
        <option value="">All</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>
            {category.name}
          </option>
        ))}
      </select>
      {filteredServices.map((service) => (
        <Card className={classes.root} key={service._id}>
          <CardContent>
            <Typography variant="h5" component="h2">
              {service.name}
            </Typography>
            <Typography color="textSecondary">
              Price: {service.price} AED
            </Typography>
            <Typography color="textSecondary">
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