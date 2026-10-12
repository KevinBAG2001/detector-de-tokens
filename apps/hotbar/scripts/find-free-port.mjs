import net from 'node:net';

/**
 * Busca un puerto TCP libre en 127.0.0.1, empezando por `startPort`.
 * @param {number} startPort
 * @param {number} maxAttempts
 * @returns {Promise<number>}
 */
export function findFreePort(startPort = 1420, maxAttempts = 50) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryPort = (port) => {
      if (attempts >= maxAttempts) {
        reject(new Error(`No se encontró puerto libre entre ${startPort} y ${startPort + maxAttempts - 1}`));
        return;
      }
      attempts += 1;

      const server = net.createServer();
      server.unref();
      server.on('error', () => tryPort(port + 1));
      server.listen(port, '127.0.0.1', () => {
        const address = server.address();
        const bound = typeof address === 'object' && address ? address.port : port;
        server.close((err) => {
          if (err) {
            tryPort(port + 1);
            return;
          }
          resolve(bound);
        });
      });
    };

    tryPort(startPort);
  });
}
