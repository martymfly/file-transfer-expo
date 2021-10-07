export type roomJoinData = {
  room: string;
  device: string;
};

export type connectedClient = {
  id: string;
  device: string;
  room: string;
};

export type fileRequest = {
  device: string;
  path: string;
  basedir: string;
};

export type fileSend = {
  name: string;
  file: string;
  sizes: string;
  device: string;
  path: string;
};

export type newFolderRequest = {
  device: string;
  name: string;
  path: string;
};
