import { Container } from 'inversify';

// inject controllers
import '@/features';

const container = new Container({ autoBindInjectable: true });

export { container };
