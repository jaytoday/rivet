import { useRecoilState, useRecoilValue } from 'recoil';
import { loadedProjectState, projectState } from '../state/savedGraphs';
import { useSaveCurrentGraph } from './useSaveCurrentGraph';
import { produce } from 'immer';
import { toast } from 'react-toastify';
import { ioProvider } from '../utils/globals';

export function useSaveProject() {
  const saveGraph = useSaveCurrentGraph();
  const project = useRecoilValue(projectState);
  const [loadedProject, setLoadedProject] = useRecoilState(loadedProjectState);

  async function saveProject() {
    if (!loadedProject.loaded || !loadedProject.path) {
      return saveProjectAs();
    }

    const savedGraph = saveGraph(); // TODO stupid react rerendering... project will still be stale and not have this graph

    const newProject = produce(project, (draft) => {
      draft.graphs[savedGraph.metadata!.id!] = savedGraph;
    });

    await ioProvider.saveProjectDataNoPrompt(newProject, loadedProject.path);
    toast.success('Project saved');
    setLoadedProject({
      loaded: true,
      path: loadedProject.path,
    });
  }

  async function saveProjectAs() {
    const savedGraph = saveGraph(); // TODO stupid react rerendering... project will still be stale and not have this graph

    const newProject = produce(project, (draft) => {
      draft.graphs[savedGraph.metadata!.id!] = savedGraph;
    });

    const filePath = await ioProvider.saveProjectData(newProject);

    if (filePath) {
      toast.success('Project saved');
      setLoadedProject({
        loaded: true,
        path: filePath,
      });
    }
  }

  return {
    saveProject,
    saveProjectAs,
  };
}
