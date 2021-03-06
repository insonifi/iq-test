'use strict';
const blessed = require('blessed');
const {debounce} = require('./utils');
const MS_TO_SEC = 1e-3;

const screen = blessed.screen({
  smartCSR: true,
});
const exInfo = blessed.box({
  left: 0,
  top: 1,
  content: 'stream info',
  width: '50%',
  height: 4,
  scrollable: 'alwaysScroll',
  tags: true,
  style: {
    fg: 'green',
  }
});
const progressBar = blessed.ProgressBar({
  left: 0,
  top: 0,
  width: '100%',
  height: 1,
  pch: '▄',
});
const progressBox = blessed.box({
  right: 0,
  top: 1,
  content: 'progress',
  tags: true,
  width: 30,
  height: 4,
});
const hostInfo = blessed.box({
  top: 5,
  right: 0,
  tags: true,
  width: 30,
  height: 2, 
});
const attemptInfo = blessed.box({
  left: 0,
  top: 5,
  tags: true,
  width: 70,
  height: 11, 
});
const statTimestamp = blessed.box({
  left:0,
  top: 16,
  tags: true,
  width: 70,
  height: 1,
});
const logBox = blessed.Log({
  left: 0,
  top: 18,
  content: 'log',
  width: '100%',
  height: 'shrink',
  scrollable: 'alwaysScroll',
  tags: true,
});
const render = debounce(() => screen.render(), 200);
screen.title = 'Intellect Platform Tester';
screen.append(exInfo);
screen.append(progressBar);
screen.append(progressBox);
screen.append(attemptInfo);
screen.append(hostInfo);
screen.append(statTimestamp);
screen.append(logBox);
render();

function log(msg) {
  logBox.log(
      `{grey-fg}${new Date() .toLocaleTimeString('en', {hour12: false})} {/}` +
      msg
  );
  render();
};

function showExInfo(e) {
  if (!e) {
    exInfo.insertTop(1, '');
    return;
  }
  const s = e.streamAttr;
  const counts = e.attempts.map(a => a.count);
  const h = e.options.isHeadless ? '▂' : '▢';
  
  exInfo.setLine(1, ''
    + `${h}${s.vendor} ${s.format} ${s.pattern} `
    + `${s.profile} ${s.bitrate}bps `
    + `${s.width}x${s.height}@${s.framerate}fps `
    + `{|}${counts}`
  );
  render();
}

function showAttemptInfo(a, progressStr) {
  attemptInfo.setContent([
      ['fps in:', a.fpsIn.toFixed(2)].join('{|}'),
      ['count:', a.count.toString()].join('{|}'),
      ['target:', a.target.toString()].join('{|}'),
      ['history:', a.camHistory.slice(-4).toString()].join('{|}'),
      ['S:', a.lastSamples.map(s => s.toFixed(2)).slice(-5)].join('{|}'),
      ['dev:', a.lastDev.toFixed(3)].join('{|}'),
      ['fps m:', a.fpsOut.toFixed(3)].join('{|}'),
      ['threshold:', a.options.fpsThreshold.toFixed(3)].join('{|}'),
      ['CPU:', a.cpuSamples].join('{|}'),
      ['resc RTT', (a.wstime * MS_TO_SEC).toFixed(3)].join('{|}'),
      ['stat RTT',
        (a.stattime1 * MS_TO_SEC).toFixed(3)
        + '…' + (a.stattimeL * MS_TO_SEC).toFixed(3)
      ].join('{|}'),
  ].join('\n'));
  render();
}

function showStatTs() {
  statTimestamp.setContent([
    'last stat at:', new Date() .toLocaleTimeString('en', {hour12: false})
  ].join('{|}'));
  render();
}

function showProgress(streams, streamIdx, timing) {
  const doneStreams = streamIdx - 1;
  const rate = timing.elapsed('global') / doneStreams;
  const estimatedMs = (streams.length - doneStreams) * rate;

  progressBar.setProgress((streamIdx / streams.length) * 100);
  progressBox.setContent([
    ['Elapsed time:', timing.elapsedString('global')].join('{|}'),
    ['Remaining time:', timing.getTimeString(estimatedMs)].join('{|}'),
    ['Stream:', streamIdx + '/' + streams.length].join('{|}'),
  ].join('\n'));
  render();
}

function showHostInfo(ip, host) {
  hostInfo.setContent([
    ['Host:', host].join('{|}'),
    ['IP:', ip].join('{|}'),
  ].join('\n'));
  render();
}

/**
 * Returns a string of processor usage values
 * @param {Attempt} attempt - attempt to get usage values from
 * @returns {string} string of following format: min%…mean%…max%
 */
function processorUsageString(attempt) {
  const cpuUsage = attempt.cpu;
  const min = cpuUsage.min;
  const mean = cpuUsage.mean;
  const max = cpuUsage.max;

  return `${min}%…${mean}%…${max}%`;
}

module.exports = {
  log,
  showExInfo,
  showAttemptInfo,
  showHostInfo,
  showStatTs,
  showProgress,
}
