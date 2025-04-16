import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  Grid,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton as MuiIconButton,
  Tooltip,
  Checkbox,
  FormControlLabel,
  Collapse
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Key as KeyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(2),
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: '#7C3AED',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

const FormField = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const UploadButton = styled(Button)(({ theme }) => ({
  border: '2px dashed #7C3AED',
  backgroundColor: 'rgba(124, 58, 237, 0.04)',
  '&:hover': {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    border: '2px dashed #6D28D9',
  },
}));

const dataTypes = [
  'TEXT',
  'INTEGER',
  'BIGINT',
  'NUMERIC',
  'REAL',
  'DOUBLE PRECISION',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'JSON',
  'UUID'
];

const AddDatabaseDialog = ({ open, onClose, formData, onChange, onFileChange, onSubmit }) => {
  const [columns, setColumns] = useState([
    { 
      name: '', 
      type: 'TEXT', 
      isPrimary: false, 
      isNotNull: false, 
      isUnique: false, 
      defaultValue: '',
      isForeignKey: false,
      foreignKeyTable: '',
      foreignKeyColumn: ''
    }
  ]);

  const [expandedRows, setExpandedRows] = useState({});

  const handleToggleExpand = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleAddColumn = () => {
    setColumns([...columns, { 
      name: '', 
      type: 'TEXT', 
      isPrimary: false, 
      isNotNull: false, 
      isUnique: false, 
      defaultValue: '',
      isForeignKey: false,
      foreignKeyTable: '',
      foreignKeyColumn: ''
    }]);
  };

  const handleRemoveColumn = (index) => {
    const newColumns = [...columns];
    newColumns.splice(index, 1);
    setColumns(newColumns);
    
    // Remove from expanded rows if it exists
    const newExpandedRows = {...expandedRows};
    delete newExpandedRows[index];
    setExpandedRows(newExpandedRows);
  };

  const handleColumnChange = (index, field, value) => {
    const newColumns = [...columns];
    
    // Ensure only one primary key can be selected
    if (field === 'isPrimary' && value === true) {
      newColumns.forEach(col => col.isPrimary = false);
    }
    
    // Reset foreign key fields if foreign key is unchecked
    if (field === 'isForeignKey' && value === false) {
      newColumns[index].foreignKeyTable = '';
      newColumns[index].foreignKeyColumn = '';
    }
    
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const handleSubmit = () => {
    if (!formData.databaseName || !formData.tableName) {
      alert('Database name and table name are required');
      return;
    }
    
    if (columns.every(col => !col.name.trim()) && !formData.csvFile) {
      alert('Either define columns or upload a CSV file');
      return;
    }
    
    for (const column of columns) {
      if (column.name.trim() && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column.name)) {
        alert('Column names must start with a letter or underscore and contain only letters, numbers, and underscores');
        return;
      }
      
      if (column.isForeignKey && (!column.foreignKeyTable || !column.foreignKeyColumn)) {
        alert('Foreign key requires both table and column references');
        return;
      }
    }
    
    const filteredColumns = columns.filter(col => col.name.trim());
    
    onSubmit({ 
      ...formData, 
      columns: filteredColumns 
    });
  };

  return (
    <StyledDialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          marginTop: '5vh'
        }
      }}
    >
      <StyledDialogTitle>
        <Typography variant="h6">Create New Database</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <DialogContent dividers sx={{ 
        maxHeight: '70vh',
        overflowY: 'auto'
      }}>
        <Box component="form" noValidate>
          <Grid container spacing={2}>
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Database Name"
                name="databaseName"
                value={formData.databaseName}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </FormField>
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Table Name"
                name="tableName"
                value={formData.tableName}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </FormField>

            <FormField item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Table Columns (Optional - define or upload CSV)
              </Typography>
              <Box sx={{ 
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #eee',
                borderRadius: '4px'
              }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell width="40px"></TableCell>
                      <TableCell>Column Name</TableCell>
                      <TableCell>Data Type</TableCell>
                      <TableCell>Primary</TableCell>
                      <TableCell>Not Null</TableCell>
                      <TableCell>Unique</TableCell>
                      <TableCell>Default</TableCell>
                      <TableCell>Foreign Key</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {columns.map((column, index) => (
                      <React.Fragment key={index}>
                        <TableRow>
                          <TableCell>
                            {column.isForeignKey && (
                              <IconButton
                                size="small"
                                onClick={() => handleToggleExpand(index)}
                              >
                                {expandedRows[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              value={column.name}
                              onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                              placeholder="Column name"
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={column.type}
                                onChange={(e) => handleColumnChange(index, 'type', e.target.value)}
                              >
                                {dataTypes.map((type) => (
                                  <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Primary Key">
                              <Checkbox
                                checked={column.isPrimary}
                                onChange={(e) => handleColumnChange(index, 'isPrimary', e.target.checked)}
                                icon={<KeyIcon />}
                                checkedIcon={<KeyIcon color="primary" />}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Not Null">
                              <Checkbox
                                checked={column.isNotNull}
                                onChange={(e) => handleColumnChange(index, 'isNotNull', e.target.checked)}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Unique">
                              <Checkbox
                                checked={column.isUnique}
                                onChange={(e) => handleColumnChange(index, 'isUnique', e.target.checked)}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={column.defaultValue}
                              onChange={(e) => handleColumnChange(index, 'defaultValue', e.target.value)}
                              placeholder="Default"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Foreign Key">
                              <Checkbox
                                checked={column.isForeignKey}
                                onChange={(e) => handleColumnChange(index, 'isForeignKey', e.target.checked)}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Remove column">
                              <MuiIconButton 
                                onClick={() => handleRemoveColumn(index)}
                              >
                                <DeleteIcon />
                              </MuiIconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                        {column.isForeignKey && (
                          <TableRow>
                            <TableCell style={{ padding: 0 }} colSpan={9}>
                              <Collapse in={expandedRows[index]} timeout="auto" unmountOnExit>
                                <Box sx={{ 
                                  margin: 1,
                                  padding: 2,
                                  backgroundColor: 'rgba(124, 58, 237, 0.05)',
                                  borderRadius: '4px'
                                }}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                      <TextField
                                        fullWidth
                                        label="Foreign Table"
                                        value={column.foreignKeyTable}
                                        onChange={(e) => handleColumnChange(index, 'foreignKeyTable', e.target.value)}
                                        placeholder="Referenced table name"
                                      />
                                    </Grid>
                                    <Grid item xs={6}>
                                      <TextField
                                        fullWidth
                                        label="Foreign Column"
                                        value={column.foreignKeyColumn}
                                        onChange={(e) => handleColumnChange(index, 'foreignKeyColumn', e.target.value)}
                                        placeholder="Referenced column name"
                                      />
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={handleAddColumn}
                  variant="outlined"
                >
                  Add Column
                </Button>
              </Box>
            </FormField>

            <FormField item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Optional CSV Upload
              </Typography>
              <input
                type="file"
                accept=".csv"
                id="csv-upload"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (file.type !== 'text/csv') {
                      alert('Please upload a CSV file');
                      return;
                    }
                    onFileChange(e);
                  }
                }}
              />
              <label htmlFor="csv-upload">
                <UploadButton
                  component="span"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  Upload CSV File (Optional)
                </UploadButton>
              </label>
              {formData.csvFile && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Chip
                    label={formData.csvFile.name}
                    onDelete={() => onChange({ target: { name: 'csvFile', value: null } })}
                    sx={{ backgroundColor: '#7C3AED', color: 'white' }}
                  />
                </Box>
              )}
            </FormField>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit" 
          sx={{ 
            borderRadius: '8px',
            borderColor: '#7C3AED',
            color: '#7C3AED',
            '&:hover': {
              borderColor: '#6D28D9',
              backgroundColor: 'rgba(124, 58, 237, 0.04)',
            },
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          sx={{ 
            backgroundColor: '#7C3AED', 
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#6D28D9',
            },
          }}
        >
          Create
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AddDatabaseDialog;