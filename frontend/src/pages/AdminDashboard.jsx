import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});

export default function AdminDashboard() {
  const [revenueData, setRevenueData] = useState({});
  const [appointmentsData, setAppointmentsData] = useState({});

  useEffect(() => {
    axios.get('/api/v1/analytics/revenue')
      .then(response => setRevenueData(response.data))
      .catch(error => console.log(error));

    axios.get('/api/v1/analytics/appointments')
      .then(response => setAppointmentsData(response.data))
      .catch(error => console.log(error));
  }, []);

  const data = [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 },
    { name: 'Group E', value: 278 },
    { name: 'Group F', value: 189 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="admin-dashboard">
      <h2>KPI Cards</h2>
      <p>Today's Appointments: {appointmentsData.todayAppointments}</p>
      <p>Revenue Today in AED: {revenueData.todayRevenue}</p>
      <p>New Customers This Week: {appointmentsData.newCustomersThisWeek}</p>
      <p>Average Rating: {appointmentsData.averageRating}</p>

      <h2>Appointment Calendar View</h2>
      <Calendar
        localizer={localizer}
        events={appointmentsData.calendarEvents || []}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />

      <h2>Revenue Last 30 Days</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={revenueData.lastThirtyDaysRevenue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <Tooltip />
          <Legend />
          <Bar dataKey="revenue" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      <h2>Appointments by Status</h2>
      <PieChart width={400} height={400}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </div>
  );
}
