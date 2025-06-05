import { Template, TemplateLoader } from '../utils/templateLoader';

export async function getDefaultTemplates(): Promise<Template[]> {
  return await TemplateLoader.loadTemplates();
}
