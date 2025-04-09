import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  useTheme,
  useMediaQuery,
} from '@mui/material';

const CustomerListSkeleton: React.FC = () => {
  const theme = useTheme();
  const isLaptop = useMediaQuery(theme.breakpoints.up('md'));

  if (isLaptop) {
    return (
      <Box sx={{ width: '100%' }}>
        <Skeleton variant="rectangular" width="100%" height={56} />
        {[...Array(5)].map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            width="100%"
            height={52}
            sx={{ mt: 1 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {[...Array(3)].map((_, index) => (
        <Grid item xs={12} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ width: '60%' }}>
                  <Skeleton variant="text" width="80%" height={32} />
                  <Skeleton variant="text" width="40%" />
                </Box>
                <Skeleton variant="rectangular" width={60} height={24} />
              </Box>
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="50%" />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1 }} />
                <Skeleton variant="circular" width={32} height={32} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default CustomerListSkeleton; 