import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow,
  Select, MenuItem, InputLabel, FormControl,
  Snackbar, Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const EditTableDialog = ({
  open,
  onClose,
  dbName,
  tableName,
  columns: initialColumns,
  onSave,
  hasData // Add this new prop
}) => {
  const [editedColumns, setEditedColumns] = useState([]);
  const [newColumn, setNewColumn] = useState({
    name: '',
    type: 'TEXT',
    defaultValue: '',
    isNullable: 'YES'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Function to map PostgreSQL data types to the Select options
  const mapDataTypeToSelect = (dataType) => {
    if (!dataType) return 'TEXT'; // Default to TEXT if undefined
    const type = dataType.toLowerCase();
    switch (type) {
      case 'integer':
        return 'INTEGER';
      case 'bigint':
        return 'BIGINT';
      case 'numeric':
        return 'NUMERIC';
      case 'boolean':
        return 'BOOLEAN';
      case 'date':
        return 'DATE';
      case 'timestamp without time zone':
      case 'timestamp':
        return 'TIMESTAMP';
      case 'jsonb':
        return 'JSONB';
      case 'character varying':
      case 'varchar':
      case 'text':
        return 'TEXT';
      default:
        return 'TEXT'; // Fallback to TEXT for unrecognized types
    }
  };

  useEffect(() => {
    if (initialColumns) {
      setEditedColumns(initialColumns.map(col => ({
        column_name: col.name || col.column_name,
        data_type: col.type || col.data_type,
        column_default: col.defaultValue || col.column_default || '',
        is_nullable: col.isNullable ? 'YES' : 'NO',
        is_primary: col.isPrimary || col.PrimaryKey || false,
        is_unique: col.isUnique || false
      })));
    }
  }, [initialColumns]);

  const validateDataType = (type) => {
    const validTypes = [
      'STRING', 'TEXT', 'INTEGER', 'BIGINT', 
      'NUMERIC', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'JSONB'
    ];
    return validTypes.includes(type.toUpperCase());
  };

  const handleColumnChange = (index, field, value) => {
    const updatedColumns = [...editedColumns];
    updatedColumns[index] = {
      ...updatedColumns[index],
      [field]: value
    };
    setEditedColumns(updatedColumns);
  };

  const handleAddColumn = () => {
    if (!newColumn.name) return;

    setEditedColumns([...editedColumns, {
      column_name: newColumn.name,
      data_type: newColumn.type,
      column_default: newColumn.defaultValue,
      is_nullable: newColumn.isNullable
    }]);

    setNewColumn({
      name: '',
      type: 'TEXT',
      defaultValue: '',
      isNullable: 'YES'
    });
  };

  const handleRemoveColumn = (index) => {
    const updatedColumns = [...editedColumns];
    updatedColumns.splice(index, 1);
    setEditedColumns(updatedColumns);
  };

  const handleSave = async () => {
    if (isSaving) return;

    // Validate columns before saving
    for (const col of editedColumns) {
      if (!validateDataType(col.data_type)) {
        setSnackbar({
          open: true,
          message: `Invalid data type for column ${col.column_name}`,
          severity: 'error'
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const success = await onSave(dbName, tableName, editedColumns);
      if (success) {
        onClose();
      } else {
        setSnackbar({
          open: true,
          message: "Failed to save changes",
          severity: "error",
        });
      }
    } catch (error) {
      console.error('Error in save handler:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save changes',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Table: {tableName}
          <Typography variant="subtitle2" color="textSecondary">
            Database: {dbName}
          </Typography>
          {hasData && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
              Note: Some modifications may be restricted because this table contains data.
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Existing Columns
            </Typography>
            <Box
              sx={{
                maxHeight: 300,
                overflow: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#bdbdbd',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Column Name</TableCell>
                    <TableCell>Data Type</TableCell>
                    <TableCell>Default Value</TableCell>
                    <TableCell>Nullable</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editedColumns.map((col, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          value={col.column_name}
                          onChange={(e) => handleColumnChange(index, 'column_name', e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <InputLabel>Data Type</InputLabel>
                          <Select
                            value={col.data_type || 'TEXT'}
                            onChange={(e) => handleColumnChange(index, 'data_type', e.target.value)}
                            label="Data Type"
                            disabled={hasData} // Disable if table has data
                          >
                            <MenuItem value="TEXT">TEXT</MenuItem>
                            <MenuItem value="INTEGER">INTEGER</MenuItem>
                            <MenuItem value="BIGINT">BIGINT</MenuItem>
                            <MenuItem value="NUMERIC">NUMERIC</MenuItem>
                            <MenuItem value="BOOLEAN">BOOLEAN</MenuItem>
                            <MenuItem value="DATE">DATE</MenuItem>
                            <MenuItem value="TIMESTAMP">TIMESTAMP</MenuItem>
                            <MenuItem value="JSONB">JSONB</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={col.column_default || ''}
                          onChange={(e) => handleColumnChange(index, 'column_default', e.target.value)}
                          fullWidth
                          size="small"
                          placeholder="NULL"
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <InputLabel>Nullable</InputLabel>
                          <Select
                            value={col.is_nullable}
                            onChange={(e) => handleColumnChange(index, 'is_nullable', e.target.value)}
                            label="Nullable"
                          >
                            <MenuItem value="YES">YES</MenuItem>
                            <MenuItem value="NO">NO</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => handleRemoveColumn(index)}
                          disabled={hasData} // Disable if table has data
                        >
                          <DeleteIcon color={hasData ? "disabled" : "error"} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>

          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Add New Column
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <TextField
                label="Column Name"
                value={newColumn.name}
                onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                size="small"
              />

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Data Type</InputLabel>
                <Select
                  value={newColumn.type}
                  onChange={(e) => setNewColumn({ ...newColumn, type: e.target.value })}
                  label="Data Type"
                >
                  <MenuItem value="TEXT">TEXT</MenuItem>
                  <MenuItem value="INTEGER">INTEGER</MenuItem>
                  <MenuItem value="BIGINT">BIGINT</MenuItem>
                  <MenuItem value="NUMERIC">NUMERIC</MenuItem>
                  <MenuItem value="BOOLEAN">BOOLEAN</MenuItem>
                  <MenuItem value="DATE">DATE</MenuItem>
                  <MenuItem value="TIMESTAMP">TIMESTAMP</MenuItem>
                  <MenuItem value="JSONB">JSONB</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Default Value"
                value={newColumn.defaultValue}
                onChange={(e) => setNewColumn({ ...newColumn, defaultValue: e.target.value })}
                size="small"
              />

              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Nullable</InputLabel>
                <Select
                  value={newColumn.isNullable}
                  onChange={(e) => setNewColumn({ ...newColumn, isNullable: e.target.value })}
                  label="Nullable"
                >
                  <MenuItem value="YES">YES</MenuItem>
                  <MenuItem value="NO">NO</MenuItem>
                </Select>
              </FormControl>

              <IconButton
                onClick={handleAddColumn}
                color="primary"
                disabled={!newColumn.name}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditTableDialog;