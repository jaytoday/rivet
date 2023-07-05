import { useEffect } from 'react';
import { useSaveProject } from './useSaveProject';
import { window } from '@tauri-apps/api';
import { match } from 'ts-pattern';
import { useNewProject } from './useNewProject';
import { useLoadProject } from './useLoadProject';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { settingsModalOpenState } from '../components/SettingsModal';
import { graphState } from '../state/graph';
import { useLoadRecording } from './useLoadRecording';
import { WebviewWindow } from '@tauri-apps/api/window';
import { ioProvider } from '../utils/globals';

type MenuIds =
  | 'settings'
  | 'quit'
  | 'new_project'
  | 'open_project'
  | 'save_project'
  | 'save_project_as'
  | 'export_graph'
  | 'import_graph'
  | 'run'
  | 'load_recording';

const handlerState: {
  handler: (e: { payload: MenuIds }) => void;
} = { handler: () => {} };

let mainWindow: WebviewWindow;

try {
  mainWindow = window.getCurrent();
  mainWindow.onMenuClicked((e) => {
    handlerState.handler(e as { payload: MenuIds });
  });
} catch (err) {
  console.warn(`Error getting main window, likely not running in tauri: ${err}`);
}

export function useRunMenuCommand() {
  return (command: MenuIds) => {
    const { handler } = handlerState;

    handler({ payload: command });
  };
}

export function useMenuCommands(
  options: {
    onRunGraph?: () => void;
  } = {},
) {
  const [graphData, setGraphData] = useRecoilState(graphState);
  const { saveProject, saveProjectAs } = useSaveProject();
  const newProject = useNewProject();
  const loadProject = useLoadProject();
  const setSettingsOpen = useSetRecoilState(settingsModalOpenState);
  const { loadRecording } = useLoadRecording();

  useEffect(() => {
    const handler: (e: { payload: MenuIds }) => void = ({ payload }) => {
      match(payload as MenuIds)
        .with('settings', () => {
          setSettingsOpen(true);
        })
        .with('quit', () => {
          mainWindow.close();
        })
        .with('new_project', () => {
          newProject();
        })
        .with('open_project', () => {
          loadProject();
        })
        .with('save_project', () => {
          saveProject();
        })
        .with('save_project_as', () => {
          saveProjectAs();
        })
        .with('export_graph', () => {
          ioProvider.saveGraphData(graphData);
        })
        .with('import_graph', () => {
          ioProvider.loadGraphData((data) => setGraphData(data));
        })
        .with('run', () => {
          options.onRunGraph?.();
        })
        .with('load_recording', () => {
          loadRecording();
        })
        .exhaustive();
    };

    const prevHandler = handlerState.handler;
    handlerState.handler = handler;

    return () => {
      handlerState.handler = prevHandler;
    };
  }, [
    saveProject,
    saveProjectAs,
    newProject,
    loadProject,
    setSettingsOpen,
    graphData,
    setGraphData,
    options,
    loadRecording,
  ]);
}
