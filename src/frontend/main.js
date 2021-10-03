const e = React.createElement;

const Main = () => {
  const [socket, setSocket] = React.useState(null);
  const [socketURL, setSocketURL] = React.useState('http://localhost:3000');
  const [roomID, setRoomID] = React.useState('');
  const [connected, setConnected] = React.useState(false);
  const [phoneClient, setPhoneClient] = React.useState();

  const connect = () => {
    if (!connected) {
      const newSocket = io(socketURL);
      setSocket(newSocket);
    }
  };

  React.useEffect(() => {
    if (socket) {
      socket.on('welcome', (data) => {
        console.log(data);
        setConnected(true);
      });
      socket.on('clients', (data) => {
        const phoneClient = data.find((client) => client.device === 'phone');
        setPhoneClient(phoneClient);
      });
    }
  }, [socket]);

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="w-3/6 h-full bg-indigo-50 flex flex-col items-center justify-center">
        <div className="w-3/6 h-1/6 flex items-start justify-evenly bg-red-200">
          <input
            className="shadow appearance-none border rounded w-36 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Room ID"
            type="text"
            value={roomID}
            onChange={(e) => {
              setRoomID(e.target.value);
            }}
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => {
              socket.emit('joinRoom', { room: roomID, device: 'browser' });
            }}
          >
            Join
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => connect()}
          >
            Connect
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => console.log(socket)}
          >
            Log
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => {
              socket.emit('request', phoneClient.id);
            }}
          >
            Get Files
          </button>
        </div>
        <div className="w-3/6 h-5/6 flex flex-col items-center justify-start bg-red-300">
          {JSON.stringify(phoneClient)}
        </div>
      </div>
    </div>
  );
};

const domContainer = document.querySelector('#main');
ReactDOM.render(<Main />, domContainer);
