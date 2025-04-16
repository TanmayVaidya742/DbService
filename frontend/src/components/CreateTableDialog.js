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
  Autocomplete
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Key as KeyIcon,
  Link as LinkIcon
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

// Mock function to get available tables - you'll need to replace this with your actual data source
const getAvailableTables = () => {
  return ['users', 'products', 'orders', 'categories'];
};

const CreateTableDialog = ({ open, onClose, dbName, onSubmit, existingTables = [] }) => {
  const [tableName, setTableName] = useState('');
  const [csvFile, setCsvFile] = useState(null);
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
  };

  const handleColumnChange = (index, field, value) => {
    const newColumns = [...columns];
    
    if (field === 'isPrimary' && value === true) {
      newColumns.forEach(col => col.isPrimary = false);
    }
    
    // Reset foreign key fields if isForeignKey is being set to false
    if (field === 'isForeignKey' && value === false) {
      newColumns[index].foreignKeyTable = '';
      newColumns[index].foreignKeyColumn = '';
    }
    
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'text/csv') {
        alert('Please upload a CSV file');
        return;
      }
      setCsvFile(file);
    }
  };

  const handleSubmit = () => {
    if (!tableName) {
      alert('Table name is required');
      return;
    }
    
    if (columns.every(col => !col.name.trim()) && !csvFile) {
      alert('Either define columns or upload a CSV file');
      return;
    }
    
    for (const column of columns) {
      if (column.name.trim() && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column.name)) {
        alert('Column names must start with a letter or underscore and contain only letters, numbers, and underscores');
        return;
      }
      
      // Validate foreign key constraints
      if (column.isForeignKey) {
        if (!column.foreignKeyTable || !column.foreignKeyColumn) {
          alert('Please specify both table and column for foreign key constraints');
          return;
        }
      }
    }
    
    const filteredColumns = columns.filter(col => col.name.trim()).map(col => ({
      name: col.name,
      type: col.type,
      isPrimary: col.isPrimary,
      isNotNull: col.isNotNull,
      isUnique: col.isUnique,
      defaultValue: col.defaultValue,
      isForeignKey: col.isForeignKey,
      foreignKeyTable: col.foreignKeyTable,
      foreignKeyColumn: col.foreignKeyColumn
    }));
    
    const formData = new FormData();
    formData.append('tableName', tableName);
    formData.append('columns', JSON.stringify(filteredColumns));
    if (csvFile) {
      formData.append('csvFile', csvFile);
    }
    
    onSubmit(dbName, formData);
    onClose();
    // Reset form
    setTableName('');
    setCsvFile(null);
    setColumns([{ 
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

  // Mock function to get columns for a table - replace with your actual implementation
  const getColumnsForTable = (tableName) => {
    // This would typically come from your database metadata
    // For now, return some mock columns
    if (tableName === 'users') return ['id', 'name', 'email'];
    if (tableName === 'products') return ['id', 'name', 'price'];
    if (tableName === 'orders') return ['id', 'user_id', 'product_id'];
    return ['id', 'name'];
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
        <Typography variant="h6">Create New Table in {dbName}</Typography>
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
                label="Table Name"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
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
                      <TableRow key={index}>
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
                              disabled={column.isForeignKey} // Disable type change for foreign keys
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
                              disabled={column.isForeignKey} // Primary keys can't be foreign keys
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
                            disabled={column.isForeignKey} // Foreign keys typically shouldn't have defaults
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Foreign Key">
                            <Checkbox
                              checked={column.isForeignKey}
                              onChange={(e) => handleColumnChange(index, 'isForeignKey', e.target.checked)}
                              icon={<LinkIcon />}
                              checkedIcon={<LinkIcon color="secondary" />}
                              disabled={column.isPrimary} // Primary keys can't be foreign keys
                            />
                          </Tooltip>
                          {column.isForeignKey && (
                            <Box sx={{ mt: 1 }}>
                              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                <Autocomplete
                                  options={existingTables.length > 0 ? existingTables : getAvailableTables()}
                                  value={column.foreignKeyTable}
                                  onChange={(e, newValue) => handleColumnChange(index, 'foreignKeyTable', newValue)}
                                  renderInput={(params) => (
                                    <TextField 
                                      {...params} 
                                      label="Reference Table" 
                                      size="small"
                                    />
                                  )}
                                />
                              </FormControl>
                              <FormControl fullWidth size="small">
                                <Autocomplete
                                  options={column.foreignKeyTable ? 
                                    getColumnsForTable(column.foreignKeyTable) : 
                                    []}
                                  value={column.foreignKeyColumn}
                                  onChange={(e, newValue) => handleColumnChange(index, 'foreignKeyColumn', newValue)}
                                  renderInput={(params) => (
                                    <TextField 
                                      {...params} 
                                      label="Reference Column" 
                                      size="small"
                                    />
                                  )}
                                  disabled={!column.foreignKeyTable}
                                />
                              </FormControl>
                            </Box>
                          )}
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
                id="csv-upload-table"
                hidden
                onChange={handleFileChange}
              />
              <label htmlFor="csv-upload-table">
                <UploadButton
                  component="span"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  Upload CSV File (Optional)
                </UploadButton>
              </label>
              {csvFile && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Chip
                    label={csvFile.name}
                    onDelete={() => setCsvFile(null)}
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
          Create Table
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default CreateTableDialog;