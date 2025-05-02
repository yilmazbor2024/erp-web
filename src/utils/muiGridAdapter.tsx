import React from 'react';
import { Grid as MuiGrid, GridProps } from '@mui/material';

// This is a temporary adapter while we fix the MUI Grid API changes
export const Grid: React.FC<any> = (props) => {
  // Remove the 'item' prop in MUI v7
  const { item, ...otherProps } = props;
  return <MuiGrid {...otherProps} />;
};

export default Grid; 