import { Platform } from "react-native";
import * as FileSystemLegacy from "expo-file-system";

let memoryStorage = {};

let NewFileSystem = null;

try {
  NewFileSystem = require("expo-file-system");
} catch (error) {
  NewFileSystem = null;
}

const STORAGE_FOLDER_NAME = "fuel-trip-storage";

function isWeb() {
  return Platform.OS === "web";
}

function getWebStorage() {
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }

  return null;
}

function getLegacyDocumentDirectory() {
  if (
    FileSystemLegacy &&
    typeof FileSystemLegacy.documentDirectory === "string" &&
    FileSystemLegacy.documentDirectory.length > 0
  ) {
    return FileSystemLegacy.documentDirectory;
  }

  return null;
}

function getNewFileSystemObjects() {
  try {
    const File = NewFileSystem?.File;
    const Directory = NewFileSystem?.Directory;
    const Paths = NewFileSystem?.Paths;

    if (!File || !Directory || !Paths || !Paths.document) {
      return null;
    }

    return {
      File,
      Directory,
      Paths,
    };
  } catch (error) {
    return null;
  }
}

async function getStoredItemUsingNewFileSystem(key) {
  const fs = getNewFileSystemObjects();

  if (!fs) {
    return null;
  }

  try {
    const { File, Directory, Paths } = fs;

    const storageDirectory = new Directory(Paths.document, STORAGE_FOLDER_NAME);

    if (!storageDirectory.exists) {
      storageDirectory.create({
        intermediates: true,
        idempotent: true,
      });
    }

    const storageFile = new File(storageDirectory, `${key}.json`);

    if (!storageFile.exists) {
      return null;
    }

    const content = storageFile.text();

    return content;
  } catch (error) {
    console.log(`New FileSystem get error for ${key}:`, error);
    return null;
  }
}

async function setStoredItemUsingNewFileSystem(key, value) {
  const fs = getNewFileSystemObjects();

  if (!fs) {
    return false;
  }

  try {
    const { File, Directory, Paths } = fs;

    const storageDirectory = new Directory(Paths.document, STORAGE_FOLDER_NAME);

    if (!storageDirectory.exists) {
      storageDirectory.create({
        intermediates: true,
        idempotent: true,
      });
    }

    const storageFile = new File(storageDirectory, `${key}.json`);

    storageFile.write(String(value));

    return true;
  } catch (error) {
    console.log(`New FileSystem set error for ${key}:`, error);
    return false;
  }
}

async function removeStoredItemUsingNewFileSystem(key) {
  const fs = getNewFileSystemObjects();

  if (!fs) {
    return false;
  }

  try {
    const { File, Directory, Paths } = fs;

    const storageDirectory = new Directory(Paths.document, STORAGE_FOLDER_NAME);
    const storageFile = new File(storageDirectory, `${key}.json`);

    if (storageFile.exists) {
      storageFile.delete();
    }

    return true;
  } catch (error) {
    console.log(`New FileSystem remove error for ${key}:`, error);
    return false;
  }
}

async function getStoredItemUsingLegacyFileSystem(key) {
  try {
    const documentDirectory = getLegacyDocumentDirectory();

    if (!documentDirectory) {
      return null;
    }

    const storageFolder = `${documentDirectory}${STORAGE_FOLDER_NAME}/`;
    const filePath = `${storageFolder}${key}.json`;

    const folderInfo = await FileSystemLegacy.getInfoAsync(storageFolder);

    if (!folderInfo.exists) {
      await FileSystemLegacy.makeDirectoryAsync(storageFolder, {
        intermediates: true,
      });
    }

    const fileInfo = await FileSystemLegacy.getInfoAsync(filePath);

    if (!fileInfo.exists) {
      return null;
    }

    const value = await FileSystemLegacy.readAsStringAsync(filePath);

    return value;
  } catch (error) {
    console.log(`Legacy FileSystem get error for ${key}:`, error);
    return null;
  }
}

async function setStoredItemUsingLegacyFileSystem(key, value) {
  try {
    const documentDirectory = getLegacyDocumentDirectory();

    if (!documentDirectory) {
      return false;
    }

    const storageFolder = `${documentDirectory}${STORAGE_FOLDER_NAME}/`;
    const filePath = `${storageFolder}${key}.json`;

    const folderInfo = await FileSystemLegacy.getInfoAsync(storageFolder);

    if (!folderInfo.exists) {
      await FileSystemLegacy.makeDirectoryAsync(storageFolder, {
        intermediates: true,
      });
    }

    await FileSystemLegacy.writeAsStringAsync(filePath, String(value), {
      encoding: FileSystemLegacy.EncodingType.UTF8,
    });

    return true;
  } catch (error) {
    console.log(`Legacy FileSystem set error for ${key}:`, error);
    return false;
  }
}

async function removeStoredItemUsingLegacyFileSystem(key) {
  try {
    const documentDirectory = getLegacyDocumentDirectory();

    if (!documentDirectory) {
      return false;
    }

    const storageFolder = `${documentDirectory}${STORAGE_FOLDER_NAME}/`;
    const filePath = `${storageFolder}${key}.json`;

    const fileInfo = await FileSystemLegacy.getInfoAsync(filePath);

    if (fileInfo.exists) {
      await FileSystemLegacy.deleteAsync(filePath);
    }

    return true;
  } catch (error) {
    console.log(`Legacy FileSystem remove error for ${key}:`, error);
    return false;
  }
}

export async function getStoredItem(key) {
  try {
    if (isWeb()) {
      const webStorage = getWebStorage();

      if (webStorage) {
        return webStorage.getItem(key);
      }

      return memoryStorage[key] || null;
    }

    const newFileSystemValue = await getStoredItemUsingNewFileSystem(key);

    if (newFileSystemValue !== null && newFileSystemValue !== undefined) {
      return newFileSystemValue;
    }

    const legacyFileSystemValue = await getStoredItemUsingLegacyFileSystem(key);

    if (legacyFileSystemValue !== null && legacyFileSystemValue !== undefined) {
      return legacyFileSystemValue;
    }

    return memoryStorage[key] || null;
  } catch (error) {
    console.log(`Storage get final fallback for ${key}:`, error);
    return memoryStorage[key] || null;
  }
}

export async function setStoredItem(key, value) {
  try {
    const stringValue = String(value);

    if (isWeb()) {
      const webStorage = getWebStorage();

      if (webStorage) {
        webStorage.setItem(key, stringValue);
        return true;
      }

      memoryStorage[key] = stringValue;
      return true;
    }

    const savedWithNewFileSystem = await setStoredItemUsingNewFileSystem(
      key,
      stringValue
    );

    if (savedWithNewFileSystem) {
      memoryStorage[key] = stringValue;
      return true;
    }

    const savedWithLegacyFileSystem = await setStoredItemUsingLegacyFileSystem(
      key,
      stringValue
    );

    if (savedWithLegacyFileSystem) {
      memoryStorage[key] = stringValue;
      return true;
    }

    memoryStorage[key] = stringValue;

    console.log(
      `Storage warning for ${key}: saved in temporary memory only. It will reset when app restarts.`
    );

    return true;
  } catch (error) {
    console.log(`Storage set final fallback for ${key}:`, error);

    memoryStorage[key] = String(value);

    return true;
  }
}

export async function removeStoredItem(key) {
  try {
    if (isWeb()) {
      const webStorage = getWebStorage();

      if (webStorage) {
        webStorage.removeItem(key);
      }

      delete memoryStorage[key];

      return true;
    }

    await removeStoredItemUsingNewFileSystem(key);
    await removeStoredItemUsingLegacyFileSystem(key);

    delete memoryStorage[key];

    return true;
  } catch (error) {
    console.log(`Storage remove final fallback for ${key}:`, error);

    delete memoryStorage[key];

    return true;
  }
}