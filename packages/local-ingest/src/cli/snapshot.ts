#!/usr/bin/env node
import { getAntigravityTokenSnapshot } from '../snapshot/antigravitySnapshot.js';

const snapshot = await getAntigravityTokenSnapshot();
process.stdout.write(`${JSON.stringify(snapshot)}\n`);
process.exit(snapshot.available ? 0 : 2);
