import { createTheme } from '@mui/material/styles';

export const tokens = {
  midnight: '#0B0B0F',
  gold: '#D4AF37',
  goldLight: '#F4E2A1',
  goldDark: '#C9A24C',
  pearl: '#F8F8F8',
  emerald: '#0F3D3E',
  beige: '#E8D8C3',
  goldGradient: 'linear-gradient(135deg, #C9A24C, #F4E2A1)',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(212,175,55,0.15)',
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0B0B0F', paper: '#111116' },
    primary: { main: '#D4AF37', contrastText: '#0B0B0F' },
    secondary: { main: '#0F3D3E' },
    text: { primary: '#F8F8F8', secondary: '#E8D8C3' },
  },
  typography: {
    fontFamily: '"Inter", "Cairo", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(212,175,55,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(135deg, #C9A24C, #F4E2A1)',
          color: '#0B0B0F',
          fontWeight: 700,
          '&:hover': { background: 'linear-gradient(135deg, #D4AF37, #F4E2A1)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(8px)',
            '& fieldset': { borderColor: 'rgba(212,175,55,0.3)' },
            '&:hover fieldset': { borderColor: '#D4AF37' },
            '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
          },
        },
      },
    },
  },
});
