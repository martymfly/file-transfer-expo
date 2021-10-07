const e = React.createElement;

const socket = io();

const {
  colors,
  CssBaseline,
  ThemeProvider,
  Typography,
  Container,
  createTheme,
  Box,
  SvgIcon,
  Link,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  InboxIcon,
  DraftsIcon,
  Icon,
  Modal,
  Skeleton,
  Breadcrumbs,
  IconButton,
  Grid,
  Input,
} = MaterialUI;

const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: colors.red.A400,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#5a88e3b0 #2b2b2b',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: '#dee3e5',
            borderRadius: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#5a88e3b0',
            minHeight: 24,
          },
          '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus':
            {
              backgroundColor: '#5a88e3',
            },
          '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active':
            {
              backgroundColor: '#5a88e3',
            },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover':
            {
              backgroundColor: '#5a88e3',
            },
          '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
            backgroundColor: '#dee3e5',
          },
        },
      },
    },
    Link: {
      styleOverrides: {
        root: {
          cursor: 'pointer',
        },
      },
    },
  },
});

const Main = () => {
  const [roomID, setRoomID] = React.useState('');
  const [phoneClient, setPhoneClient] = React.useState(null);
  const [path, setPath] = React.useState([]);
  const [files, setFiles] = React.useState([]);
  const [imageURI, setImageURI] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const fileChunk = React.useRef('data:image/png;base64,');
  const [baseDir, setBaseDir] = React.useState('docdir');

  React.useEffect(() => {
    if (socket) {
      socket.on('clients', (data) => {
        const phoneClient = data.find((client) => client.device === 'phone');
        setPhoneClient(phoneClient);
        setPath([]);
        requestFiles(phoneClient, '', baseDir);
      });

      socket.on('respond', (data) => {
        setFiles(data.files);
      });

      socket.on('respondfile', (data) => {
        fileChunk.current += data.file;
        if (fileChunk.current.length === data.size + 22) {
          fetch(fileChunk.current)
            .then((res) => res.blob())
            .then((data) => {
              const objectURL = URL.createObjectURL(data);
              setImageURI(objectURL);
            });
        }
      });
    }
  }, [socket]);

  const requestFiles = (phoneClient, path, basedir) => {
    if (socket && phoneClient) {
      socket.emit('request', {
        device: phoneClient.id,
        path,
        basedir,
      });
    }
  };

  const readFile = (path) => {
    setModalOpen(true);
    fileChunk.current = 'data:image/png;base64,';
    if (socket && phoneClient) {
      socket.emit('readfile', {
        device: phoneClient.id,
        path,
        basedir: baseDir,
      });
    }
  };

  const handleFileSubmit = (files) => {
    for (let i = 0; i < files.length; i++) {
      const filename = files[i].name;
      const reader = new FileReader();
      reader.readAsDataURL(files[i]);
      reader.onload = () => {
        transferFile(filename, reader.result, 1024 * 100);
      };
    }
  };

  const transferFile = (filename, fileEncoded, bufferSize) => {
    let chunk = fileEncoded.slice(0, bufferSize);
    let data = fileEncoded.slice(bufferSize, fileEncoded.length);
    socket.emit('sendfile', {
      name: filename,
      file: chunk,
      size: fileEncoded.length,
      device: phoneClient.id,
      path: path.join('/'),
    });
    if (data.length > 0) {
      transferFile(filename, data, bufferSize);
    } else {
      requestFiles(phoneClient, path.join('/'), baseDir);
    }
  };

  const addNewFolder = () => {
    socket.emit('newfolder', {
      device: phoneClient.id,
      name: newFolderName,
      path: path.join('/'),
    });
    setNewFolderDialogOpen(false);
    setNewFolderName('');
    setTimeout(() => {
      requestFiles(phoneClient, path.join('/'), baseDir);
    }, 100);
  };

  const navigateUpFolder = () => {
    if (path.length === 0) return;
    const currentPath = path;
    currentPath.splice(-1);
    requestFiles(phoneClient, currentPath.join('/'), baseDir);
    setPath((_) => currentPath);
  };

  const handleNavigation = (file) => {
    if (file.isDirectory) {
      const requestPath = path.join('/');
      requestFiles(phoneClient, requestPath + '/' + file.name, baseDir);
      setPath((prev) => [...prev, file.name]);
    } else {
      readFile(path.join('/') + '/' + file.name);
    }
  };

  const handleBreadcrumbLink = (index) => {
    if (index === -1) {
      requestFiles(phoneClient, '', baseDir);
      setPath([]);
      return;
    }
    requestFiles(phoneClient, path.slice(0, index + 1).join('/'), baseDir);
    setPath((_) => path.slice(0, index + 1));
  };

  const handleBaseDir = (dir) => {
    setPath([]);
    requestFiles(phoneClient, '', dir);
    setBaseDir(dir);
  };

  return (
    <Container maxWidth="md" sx={{ display: 'flex' }}>
      {/* IMAGE VIEW MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setImageURI(null);
        }}
        aria-labelledby="image-preview-modal"
        aria-describedby="image-preview-modal"
      >
        <Box sx={modalStyle}>
          {!imageURI ? (
            <Skeleton variant="rectangular" width={'100%'} height={'100%'} />
          ) : (
            <img
              style={{
                height: '100%',
                maxHeight: '100%',
                width: '100%',
                maxWidth: '100%',
                resizeMode: 'contain',
              }}
              src={imageURI}
              className="previewImage"
            />
          )}
        </Box>
      </Modal>
      {/* NEW FOLDER DIALOG */}
      <Modal
        open={newFolderDialogOpen}
        onClose={() => {
          setNewFolderDialogOpen(false);
          setNewFolderName('');
        }}
        aria-labelledby="new-folder-dialog"
        aria-describedby="new-folder-dialog"
      >
        <Box sx={newFolderDialogStyle}>
          <TextField
            id="standard-basic"
            label="Folder Name"
            variant="standard"
            onChange={(e) => {
              setNewFolderName(e.target.value);
            }}
            value={newFolderName}
            autoFocus
          />
          <Button variant="outlined" onClick={addNewFolder}>
            Add
          </Button>
        </Box>
      </Modal>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Box
            sx={{
              paddingTop: 12,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <List>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleBaseDir('docdir')}>
                    <ListItemIcon>
                      <Icon>home</Icon>
                    </ListItemIcon>
                    <ListItemText primary="Document Directory" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleBaseDir('cachedir')}>
                    <ListItemIcon>
                      <Icon>archive</Icon>
                    </ListItemIcon>
                    <ListItemText primary="Cache Directory" />
                  </ListItemButton>
                </ListItem>
              </List>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span>Server IP</span>
              <img src="qr.png" />
            </div>
          </Box>
        </Grid>
        <Grid item xs={9}>
          <Box>
            <Box
              sx={{
                my: 1,
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-start',
                paddingLeft: 1,
              }}
            >
              <TextField
                id="standard-basic"
                label="Room ID"
                variant="standard"
                onChange={(e) => {
                  setRoomID(e.target.value);
                }}
                value={roomID}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  socket.emit('joinRoom', { room: roomID, device: 'browser' });
                }}
              >
                Join
              </Button>
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingLeft: 1,
                }}
              >
                <IconButton
                  color="primary"
                  aria-label="go back"
                  component="span"
                  onClick={() => setNewFolderDialogOpen(true)}
                >
                  <Icon sx={{ fontSize: 32 }}>create_new_folder</Icon>
                </IconButton>
                <label htmlFor="icon-button-file">
                  <input
                    onChange={(e) => handleFileSubmit(e.target.files)}
                    style={{ display: 'none' }}
                    accept="image/*"
                    id="icon-button-file"
                    type="file"
                    multiple
                  />
                  <IconButton
                    color="primary"
                    aria-label="go back"
                    component="span"
                  >
                    <Icon sx={{ fontSize: 32 }}>upload_file</Icon>
                  </IconButton>
                </label>
              </Box>
            </Box>
            <Box
              sx={{
                width: '100%',
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <IconButton
                color="primary"
                aria-label="go back"
                component="span"
                onClick={() => navigateUpFolder()}
              >
                <Icon>subdirectory_arrow_left</Icon>
              </IconButton>
              <Breadcrumbs
                separator={<Icon>chevron_right</Icon>}
                aria-label="breadcrumb"
              >
                <Link
                  component="button"
                  underline="hover"
                  key="1"
                  color="inherit"
                  onClick={() => handleBreadcrumbLink(-1)}
                >
                  Home
                </Link>
                {path.map((pathItem, index) => (
                  <Link
                    component="button"
                    underline="hover"
                    key="1"
                    color="inherit"
                    onClick={() => handleBreadcrumbLink(index)}
                  >
                    {decodeURI(pathItem)}
                  </Link>
                ))}
              </Breadcrumbs>
            </Box>
            <Box
              sx={{
                width: '100%',
                height: 500,
                overflow: 'scroll',
                overflowX: 'hidden',
              }}
            >
              <List>
                {files.map((file, index) => (
                  <ListItem
                    key={index}
                    disablePadding
                    onClick={() => handleNavigation(file)}
                  >
                    <ListItemButton>
                      <ListItemIcon>
                        <Icon>
                          {file.isDirectory
                            ? 'folder_open'
                            : 'insert_drive_file'}
                        </Icon>
                      </ListItemIcon>
                      <ListItemText
                        primary={decodeURI(file.name)}
                        secondary={humanFileSize(file.size)}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

const domContainer = document.querySelector('#root');
ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Main />
  </ThemeProvider>,
  domContainer,
);

const modalStyle = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80vw',
  maxWidth: '1200px',
  height: '90vh',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const newFolderDialogStyle = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 300,
  height: 100,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function humanFileSize(bytes, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + ' ' + units[u];
}
