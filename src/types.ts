/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppView = 'convert' | 'edit' | 'ai-tools';

export interface FileData {
  id: string;
  name: string;
  file: File;
  preview?: string;
}

export interface PdfTextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}
