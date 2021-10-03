const e = React.createElement;

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
});

const Main = () => {
  const [socket, setSocket] = React.useState(io());
  const [roomID, setRoomID] = React.useState('');
  const [connected, setConnected] = React.useState(false);
  const [phoneClient, setPhoneClient] = React.useState(null);
  const [path, setPath] = React.useState('');
  const [files, setFiles] = React.useState([]);
  const [imageURI, setImageURI] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const fileChunk = React.useRef('data:image/png;base64,');

  React.useEffect(() => {
    if (socket) {
      socket.on('clients', (data) => {
        const phoneClient = data.find((client) => client.device === 'phone');
        setPhoneClient(phoneClient);
        requestFiles(phoneClient, path);
      });

      socket.on('respond', (data) => {
        console.log(data);
        setFiles(data.files);
        setPath(data.path);
      });

      socket.on('respondfile', (data) => {
        fileChunk.current += data.file;
        if (fileChunk.current.length === data.size + 22) {
          //setImage(fileChunk.current);
          console.log(fileChunk.current.length);
          fetch(fileChunk.current)
            .then((res) => res.blob())
            .then((data) => {
              const objectURL = URL.createObjectURL(data);
              setImageURI(objectURL);
              setModalOpen(true);
            });
        }
      });
    }
  }, [socket]);

  const requestFiles = (phoneClient, path) => {
    if (socket && phoneClient) {
      socket.emit('request', { device: phoneClient.id, path });
    }
  };

  const readFile = (path) => {
    fileChunk.current = 'data:image/png;base64,';
    if (socket && phoneClient) {
      socket.emit('readfile', { device: phoneClient.id, path });
    }
  };

  const navigateUpFolder = () => {
    if (
      path.endsWith('expo-file-manager/') ||
      path.endsWith('expo-file-manager')
    ) {
      return;
    } else {
      setPath((prev) => {
        let newPath = prev.split('/');
        newPath.splice(-1);
        newPath = newPath.join('/');
        requestFiles(phoneClient, newPath);
        return newPath;
      });
    }
  };

  return (
    <Container maxWidth="sm">
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <img
            style={{ height: '100%', width: '100%', resizeMode: 'cover' }}
            src={imageURI}
            loading="lazy"
          />
        </Box>
      </Modal>
      <Box
        sx={{
          my: 4,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
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
      </Box>
      <Button variant="outlined" onClick={() => navigateUpFolder()}>
        Back
      </Button>
      <Box
        sx={{
          width: '100%',
          height: 500,
          overflow: 'scroll',
        }}
      >
        <List>
          {files.map((file, index) => (
            <ListItem
              key={index}
              disablePadding
              onClick={() => {
                if (file.isDirectory) {
                  requestFiles(phoneClient, path + '/' + file.name);
                } else {
                  readFile(path + '/' + file.name);
                }
              }}
            >
              <ListItemButton>
                <ListItemIcon>
                  <Icon>
                    {file.isDirectory ? 'folder_open' : 'insert_drive_file'}
                  </Icon>
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={humanFileSize(file.size)}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
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
