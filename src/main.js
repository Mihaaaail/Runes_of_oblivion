import { GameManager } from './GameManager.js';
import { GameRenderer } from './view/GameRenderer.js';
import { RunFlowController } from './run/RunFlowController.js';

(async () => {
  const gameManager = new GameManager();
  const renderer = new GameRenderer(gameManager);
  await renderer.init();
  gameManager.setRenderer(renderer);

  const flow = new RunFlowController({ gameManager });
  flow.init();
})();
