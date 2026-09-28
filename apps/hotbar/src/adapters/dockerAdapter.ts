export interface DockerContainerStub {
  id: string;
  name: string;
  status: 'stub';
}

export interface DockerPanelState {
  module: 'docker';
  enabled: false;
  containers: DockerContainerStub[];
  note: string;
}

/** Placeholder para futuro panel Docker (up/down + nombres). */
export function getDockerPanelState(): DockerPanelState {
  return {
    module: 'docker',
    enabled: false,
    containers: [],
    note: 'Módulo planificado: contenedores Docker básicos.',
  };
}
