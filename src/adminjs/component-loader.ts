import { ComponentLoader } from 'adminjs';

const componentLoader = new ComponentLoader();

const COMPONENTS = {
  RichTextEditor: componentLoader.add('RichTextEditor', './components/RichTextEditor'),
};

export { componentLoader, COMPONENTS };
