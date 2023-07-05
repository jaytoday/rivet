import { css } from '@emotion/react';
import { FC, useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { graphState } from '../state/graph';
import { loadedProjectState, projectState, savedGraphsState } from '../state/savedGraphs';
import { ReactComponent as ExpandLeftIcon } from 'majesticons/line/menu-expand-left-line.svg';
import { ReactComponent as ExpandRightIcon } from 'majesticons/line/menu-expand-right-line.svg';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import { NodeGraph } from '@ironclad/rivet-core';
import { sidebarOpenState } from '../state/graphBuilder';
import { appWindow } from '@tauri-apps/api/window';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import { GraphList } from './GraphList';
import { useContextMenu } from '../hooks/useContextMenu';
import Portal from '@atlaskit/portal';
import { useStableCallback } from '../hooks/useStableCallback';

const styles = css`
  position: fixed;
  top: 32px; // Adjust this value based on the height of the MenuBar
  left: 0;
  bottom: 0;
  width: 250px; // Adjust the width of the sidebar as needed
  background-color: rgba(46, 46, 46, 0.35);
  padding: 0;
  z-index: 50;
  border-right: 1px solid var(--grey);
  height: calc(100vh - 32px);

  .panel {
    display: flex;
    flex-direction: column;
    width: 250px;
    margin: 0 -8px;
  }

  label {
    font-size: 12px;
  }

  .graph-info-section,
  .project-info-section {
    padding: 8px 12px;
  }

  .toggle-tab {
    position: absolute;
    top: 10px;
    right: -32px;
    background-color: var(--grey-dark);
    border: 1px solid var(--grey);
    border-left: 0;
    border-radius: 0 8px 8px 0;
    width: 32px;
    height: 32px;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100;
  }

  .toggle-tab:hover {
    background-color: var(--grey-darkish);
  }

  .tabs,
  .tabs > div {
    height: 100%;
  }
`;

export const LeftSidebar: FC = () => {
  const [graph, setGraph] = useRecoilState(graphState);
  const [project, setProject] = useRecoilState(projectState);
  const [savedGraphs, setSavedGraphs] = useRecoilState(savedGraphsState);
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);

  const loadedProject = useRecoilValue(loadedProjectState);

  function setGraphAndSavedGraph(graph: NodeGraph) {
    setGraph(graph);
    setSavedGraphs(savedGraphs.map((g) => (g.metadata!.id === graph.metadata!.id ? graph : g)));
  }

  useEffect(() => {
    (async () => {
      try {
        await appWindow.setTitle(`Rivet - ${project.metadata.title} (${loadedProject.path})`);
      } catch (err) {
        console.warn(`Failed to set window title, likely not running in Tauri: ${err}`);
      }
    })();
  }, [loadedProject, project.metadata.title]);

  const handleSidebarContextMenu = useStableCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    handleContextMenu(e);
  });

  return (
    <div
      css={styles}
      style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease' }}
      key={project.metadata.id}
      onContextMenu={handleSidebarContextMenu}
    >
      <div className="toggle-tab" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <ExpandLeftIcon /> : <ExpandRightIcon />}
      </div>
      <div className="tabs">
        <Tabs id="sidebar-tabs">
          <TabList>
            <Tab>Graphs</Tab>
            <Tab>Graph Info</Tab>
            <Tab>Project</Tab>
          </TabList>
          <TabPanel>
            <div className="panel" data-contextmenutype="graph-list">
              <GraphList />
            </div>
          </TabPanel>
          <TabPanel>
            <div className="panel">
              <div className="graph-info-section">
                <InlineEditableTextfield
                  key={`graph-name-${graph.metadata?.id}`}
                  label="Graph Name"
                  placeholder="Graph Name"
                  onConfirm={(newValue) =>
                    setGraphAndSavedGraph({ ...graph, metadata: { ...graph.metadata, name: newValue } })
                  }
                  defaultValue={graph.metadata?.name ?? 'Untitled Graph'}
                  readViewFitContainerWidth
                />
                <InlineEditableTextfield
                  key={`graph-description-${graph.metadata?.id}`}
                  label="Description"
                  placeholder="Graph Description"
                  defaultValue={graph.metadata?.description ?? ''}
                  onConfirm={(newValue) =>
                    setGraphAndSavedGraph({ ...graph, metadata: { ...graph.metadata, description: newValue } })
                  }
                  readViewFitContainerWidth
                />
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="panel">
              <div className="project-info-section">
                <InlineEditableTextfield
                  key={`name-${project.metadata.id}`}
                  label="Project Name"
                  placeholder="Project Name"
                  readViewFitContainerWidth
                  defaultValue={project.metadata.title}
                  onConfirm={(newValue) =>
                    setProject({ ...project, metadata: { ...project.metadata, title: newValue } })
                  }
                />

                <InlineEditableTextfield
                  key={`description-${project.metadata.id}`}
                  label="Description"
                  placeholder="Project Description"
                  defaultValue={project.metadata?.description ?? ''}
                  onConfirm={(newValue) =>
                    setProject({ ...project, metadata: { ...project.metadata, description: newValue } })
                  }
                  readViewFitContainerWidth
                />
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
};
