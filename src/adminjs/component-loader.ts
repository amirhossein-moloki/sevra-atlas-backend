/**
 * Component loader for AdminJS.
 * Using a factory function to defer loading ESM-only dependencies.
 */
export const createComponentLoader = async () => {
    const { ComponentLoader } = await (eval('import("adminjs")') as Promise<any>);
    const componentLoader = new ComponentLoader();

    const COMPONENTS = {
        RichTextEditor: componentLoader.add('RichTextEditor', './components/RichTextEditor'),
    };

    return { componentLoader, COMPONENTS };
};
