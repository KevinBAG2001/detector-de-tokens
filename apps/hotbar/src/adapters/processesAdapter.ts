export interface DevProcessStub {
  id: string;
  name: string;
  status: 'stub';
}

export interface ProcessesPanelState {
  module: 'processes';
  enabled: false;
  items: DevProcessStub[];
  note: string;
}

/** Placeholder para futuro panel de proyectos/procesos en ejecución. */
export function getProcessesPanelState(): ProcessesPanelState {
  return {
    module: 'processes',
    enabled: false,
    items: [],
    note: 'Módulo planificado: listar procesos de desarrollo locales.',
  };
}
