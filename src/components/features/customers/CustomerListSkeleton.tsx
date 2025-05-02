import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Skeleton,
  useTheme,
  useMediaQuery,
} from '@mui/material';

const CustomerListSkeleton: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <Box sx={{ width: '100%' }}>
        {[...Array(3)].map((_, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Skeleton variant="text" width="40%" height={30} />
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="70%" />
            </CardContent>
            <CardActions>
              <Skeleton variant="rectangular" width={80} height={30} />
              <Skeleton variant="rectangular" width={80} height={30} />
            </CardActions>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="rectangular" width="100%" height={50} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={400} />
    </Box>
  );
};

export default CustomerListSkeleton;