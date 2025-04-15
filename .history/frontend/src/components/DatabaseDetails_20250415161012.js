import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
	Box, Typography, Container, Button, Paper,
	Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
	Chip, Divider, Snackbar, Alert, Drawer, AppBar, Toolbar, IconButton,
	List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Storage as StorageIcon,
	Menu as MenuIcon,
	Settings as SettingsIcon,
	Person as PersonIcon,
	MoreVert as MoreVertIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const DatabaseDetails = () => {
	const { dbName } = useParams();
	const navigate = useNavigate();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [database, setDatabase] = useState(null);
	const [loading, setLoading] = useState(true);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		severity: 'success'
	});
	const [anchorEl, setAnchorEl] = useState(null);
	const [currentTable, setCurrentTable] = useState(null);

	useEffect(() => {
		const fetchDatabaseDetails = async () => {
			try {
				const response = await axios.get(`http://localhost:5000/api/databases/${dbName}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`
					}
				});
				setDatabase(response.data);
			} catch (error) {
				console.error('Error fetching database details:', error);
				setSnackbar({
					open: true,
					message: error.response?.data?.error || 'Failed to fetch database details',
					severity: 'error'
				});
			} finally {
				setLoading(false);
			}
		};

		fetchDatabaseDetails();
	}, [dbName]);

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen);
	};

	const handleCloseSnackbar = () => {
		setSnackbar({ ...snackbar, open: false });
	};

	const handleMenuOpen = (event, table) => {
		setAnchorEl(event.currentTarget);
		setCurrentTable(table);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setCurrentTable(null);
	};

	/**
	 * 
	 * @param {string} dbName 
	 * @param {string} tableName 
	 * @param {'read' | 'insert' | 'delete' | 'update' } action 
	 */
	const generateandCopyUrlByActionType = (dbName, tableName, action) => {
		const baseUrl = REACT_APP_SERVER_BASE_URL;
		switch(action){
			case 'read': {
				console.log()
				break;
			}

			case 'read': {
				break;
			}

			case 'read': {
				break;
			}

			case 'read': {
				break;
			}

			default: {
				console.log('Invalid action!!')
			}

		}
	};


	const handleMenuAction = (action) => {
		handleMenuClose();
		switch (action) {
			case 'read':
				navigate(`/database/${dbName}/table/${currentTable.tablename}`);
				break;
			case 'insert':
				// Handle insert action
				setSnackbar({
					open: true,
					message: `Insert action for table ${currentTable.tablename}`,
					severity: 'info'
				});
				break;
			case 'update':
				// Handle update action
				setSnackbar({
					open: true,
					message: `Update action for table ${currentTable.tablename}`,
					severity: 'info'
				});
				break;
			case 'delete':
				// Handle delete action
				setSnackbar({
					open: true,
					message: `Delete action for table ${currentTable.tablename}`,
					severity: 'info'
				});
				break;
			default:
				break;
		}
	};

	const drawer = (
		<div>
			<Toolbar>
				<Typography variant="h6">1SPOC</Typography>
			</Toolbar>
			<Divider />
			<List>
				<ListItem button onClick={() => navigate('/UserDashboard')}>
					<ListItemIcon><PersonIcon /></ListItemIcon>
					<ListItemText primary="Users Dashboard" />
				</ListItem>
			</List>
		</div>
	);

	if (loading) {
		return (
			<Box sx={{ display: 'flex' }}>
				<AppBar
					position="fixed"
					sx={{
						zIndex: (theme) => theme.zIndex.drawer + 1,
						backgroundColor: '#7C3AED',
						width: { sm: `calc(100% - ${drawerWidth}px)` },
						ml: { sm: `${drawerWidth}px` },
					}}
				>
					<Toolbar>
						<IconButton
							color="inherit"
							edge="start"
							onClick={handleDrawerToggle}
							sx={{ mr: 2, display: { sm: 'none' } }}
						>
							<MenuIcon />
						</IconButton>
						<Typography variant="h6" noWrap component="div">
							Database Details
						</Typography>
					</Toolbar>
				</AppBar>
				<Box
					component="nav"
					sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
				>
					<Drawer
						variant="temporary"
						open={mobileOpen}
						onClose={handleDrawerToggle}
						ModalProps={{
							keepMounted: true, // Better open performance on mobile.
						}}
						sx={{
							display: { xs: 'block', sm: 'none' },
							'& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
						}}
					>
						{drawer}
					</Drawer>
					<Drawer
						variant="permanent"
						sx={{
							display: { xs: 'none', sm: 'block' },
							'& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
						}}
						open
					>
						{drawer}
					</Drawer>
				</Box>
				<Box
					component="main"
					sx={{
						flexGrow: 1,
						p: 3,
						width: { sm: `calc(100% - ${drawerWidth}px)` },
					}}
				>
					<Toolbar />
					<Container maxWidth="lg">
						<Typography variant="h6">Loading database details...</Typography>
					</Container>
				</Box>
			</Box>
		);
	}

	if (!database) {
		return (
			<Box sx={{ display: 'flex' }}>
				<AppBar
					position="fixed"
					sx={{
						zIndex: (theme) => theme.zIndex.drawer + 1,
						backgroundColor: '#7C3AED',
						width: { sm: `calc(100% - ${drawerWidth}px)` },
						ml: { sm: `${drawerWidth}px` },
					}}
				>
					<Toolbar>
						<IconButton
							color="inherit"
							edge="start"
							onClick={handleDrawerToggle}
							sx={{ mr: 2, display: { sm: 'none' } }}
						>
							<MenuIcon />
						</IconButton>
						<Typography variant="h6" noWrap component="div">
							Database Details
						</Typography>
					</Toolbar>
				</AppBar>
				<Box
					component="nav"
					sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
				>
					<Drawer
						variant="temporary"
						open={mobileOpen}
						onClose={handleDrawerToggle}
						ModalProps={{
							keepMounted: true,
						}}
						sx={{
							display: { xs: 'block', sm: 'none' },
							'& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
						}}
					>
						{drawer}
					</Drawer>
					<Drawer
						variant="permanent"
						sx={{
							display: { xs: 'none', sm: 'block' },
							'& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
						}}
						open
					>
						{drawer}
					</Drawer>
				</Box>
				<Box
					component="main"
					sx={{
						flexGrow: 1,
						p: 3,
						width: { sm: `calc(100% - ${drawerWidth}px)` },
					}}
				>
					<Toolbar />
					<Container maxWidth="lg">
						<Typography variant="h6">Database not found</Typography>
					</Container>
				</Box>
			</Box>
		);
	}

	return (
		<Box sx={{ display: 'flex' }}>
			<AppBar
				position="fixed"
				sx={{
					zIndex: (theme) => theme.zIndex.drawer + 1,
					backgroundColor: '#7C3AED',
					width: { sm: `calc(100% - ${drawerWidth}px)` },
					ml: { sm: `${drawerWidth}px` },
				}}
			>
				<Toolbar>
					<IconButton
						color="inherit"
						edge="start"
						onClick={handleDrawerToggle}
						sx={{ mr: 2, display: { sm: 'none' } }}
					>
						<MenuIcon />
					</IconButton>
					<Typography variant="h6" noWrap component="div">
						Database: {database.dbname}
					</Typography>
					<IconButton color="inherit" sx={{ ml: 'auto' }}>
						<SettingsIcon />
					</IconButton>
				</Toolbar>
			</AppBar>
			<Box
				component="nav"
				sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
			>
				<Drawer
					variant="temporary"
					open={mobileOpen}
					onClose={handleDrawerToggle}
					ModalProps={{
						keepMounted: true,
					}}
					sx={{
						display: { xs: 'block', sm: 'none' },
						'& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
					}}
				>
					{drawer}
				</Drawer>
				<Drawer
					variant="permanent"
					sx={{
						display: { xs: 'none', sm: 'block' },
						'& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
					}}
					open
				>
					{drawer}
				</Drawer>
			</Box>
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					p: 3,
					width: { sm: `calc(100% - ${drawerWidth}px)` },
				}}
			>
				<Toolbar />
				<Container maxWidth="lg">
					<Box sx={{ mt: 4, mb: 4 }}>
						<Button
							startIcon={<ArrowBackIcon />}
							onClick={() => navigate('/UserDashboard')}
							sx={{ mb: 2 }}
						>
							Back to Dashboard
						</Button>

						<Paper elevation={3} sx={{ p: 3, mb: 3 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
								<StorageIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
								<Typography variant="h4">{database.dbname}</Typography>
							</Box>

							<Divider sx={{ my: 2 }} />

							<Typography variant="h6" gutterBottom>Tables in this database</Typography>
							<TableContainer>
								<Table>
									<TableHead>
										<TableRow>
											<TableCell>Table Name</TableCell>
											<TableCell>Columns</TableCell>
											<TableCell>Actions</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{database.tables.map((table) => (
											<TableRow key={table.tablename}>
												<TableCell>{table.tablename}</TableCell>
												<TableCell>
													{Object.entries(table.schema).map(([colName, colType]) => (
														<Chip
															key={colName}
															label={`${colName}: ${colType}`}
															sx={{ mr: 1, mb: 1 }}
															variant="outlined"
														/>
													))}
												</TableCell>
												<TableCell>
													<IconButton
														aria-label="more"
														aria-controls={`table-menu-${table.tablename}`}
														aria-haspopup="true"
														onClick={(e) => handleMenuOpen(e, table)}
													>
														<MoreVertIcon />
													</IconButton>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						</Paper>
					</Box>

					<Menu
						id="table-actions-menu"
						anchorEl={anchorEl}
						keepMounted
						open={Boolean(anchorEl)}
						onClose={handleMenuClose}
					>
						<MenuItem onClick={() => handleMenuAction('read')}>Read Data</MenuItem>
						<MenuItem onClick={() => handleMenuAction('insert')}>Insert Data</MenuItem>
						<MenuItem onClick={() => handleMenuAction('update')}>Update Data</MenuItem>
						<MenuItem onClick={() => handleMenuAction('delete')}>Delete Data</MenuItem>
					</Menu>

					<Snackbar
						open={snackbar.open}
						autoHideDuration={6000}
						onClose={handleCloseSnackbar}
						anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					>
						<Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
							{snackbar.message}
						</Alert>
					</Snackbar>
				</Container>
			</Box>
		</Box>
	);
};

export default DatabaseDetails;