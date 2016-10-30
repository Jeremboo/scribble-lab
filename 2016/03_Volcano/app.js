import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import dat from 'dat-gui';

import SquigglySVG from '../00_modules/squiggly/SquigglySVG.js';

window.React = React;


ReactDOM.render(
  <svg id="volcano" viewBox="0 0 200 200">
    <g>
      <path id="XMLID_26_" className="st0" d="M36.5,204.2c0,0,35.7-89.7,44-96.6c8.3-6.9,31.1-22.4,51.6,0c13.3,16.1,39.6,96.6,39.6,96.6 H36.5z" />
      <path id="XMLID_2_" className="st1" d="M86.4,111.9c7.2-15.1,31.9-10.1,31.9-10.1s3.3,5,3.6,11.1s-20.2,7-20.2,7S79.2,127,86.4,111.9z" />
      <g id="face">
        <ellipse id="XMLID_10_" className="st2" cx="104.7" cy="134" rx="1.2" ry="1.8" />
        <ellipse id="XMLID_8_" className="st2" cx="129.5" cy="131.3" rx="1.4" ry="2.1" />
        <g id="mouth">
          <ellipse id="XMLID_13_" className="st2" cx="120.5" cy="143" rx="2.6" ry="2.9" />
          <path id="XMLID_12_" className="st3" d="M117.9,143.5c0.2,1.4,1.3,2.4,2.6,2.4c0.5,0,1-0.2,1.4-0.5c-0.2-1.4-1.3-2.4-2.6-2.4 C118.8,143,118.3,143.2,117.9,143.5z" />
        </g>
      </g>
      <g id="face2">
        <path id="XMLID_21_" className="st4" d="M101.3,134.3c0,0-0.3-3,3.1-3s3.1,3,3.1,3" />
        <path id="XMLID_22_" className="st4" d="M126.4,133.8c0,0-0.3-3.4,3.1-3.4c3.5,0,3.1,3.4,3.1,3.4" />
        <path id="XMLID_20_" className="st4" d="M124.9,141c0,0,0.6,5.5-6.5,5.5c-7.1,0-6.5-5.5-6.5-5.5" />
        <ellipse id="XMLID_23_" className="st5" cx="104.8" cy="138.3" rx="3.2" ry="2.4" />
        <ellipse id="XMLID_1_" className="st5" cx="130" cy="137.7" rx="3.2" ry="2.4" />
      </g>
    </g>
    <SquigglySVG id="lava">
      <path id="XMLID_3_" className="st6" d="M94,113.6c0,0-2.4-12.8-3-22.6C90.3,81.1,85-6,85-6h44.1c0,0-6.7,58.8-9.6,72.2 c-2.9,13.4-3.4,45.6-3.4,45.6L94,113.6z" />
      <path id="XMLID_4_" className="st7" d="M98.6,114.9c0,0-1.4-83.1-2.7-94.1S91.8-4,91.8-6s29.4,1.1,30.8-0.2c1.4-1.3-3.1,49.6-6.7,61.3 c-3.6,11.7-2.9,58.1-2.9,58.1L98.6,114.9z" />
      <path id="XMLID_5_" className="st8" d="M104.4,113.6c0,0,1.9-65.1-0.9-75.5c-2.8-10.4-1-44-1-44s10.3,0,12.8,0 c2.5,0-6.3,117.8-6.3,117.8L104.4,113.6z" />
      <g id="bubbles">
        <path id="XMLID_7_" className="st6" d="M79,53.2c0,1.5-2.8,2.8-2.8,2.8s-2.8-1.2-2.8-2.8s1.2-2.8,2.8-2.8S79,51.7,79,53.2z" />
        <circle id="XMLID_9_" className="st8" cx="80.6" cy="70.6" r="1.6" />
        <circle id="XMLID_11_" className="st7" cx="75.4" cy="83.9" r="1.9" />
        <path id="XMLID_14_" className="st7" d="M62,30.4c0,2.4-1.1,2.4-2.4,2.4s-2.4-1.1-2.4-2.4s1.1-2.4,2.4-2.4S62,28,62,30.4z" />
        <ellipse id="XMLID_15_" className="st8" cx="133.2" cy="94" rx="2.3" ry="1.7" />
        <ellipse id="XMLID_16_" className="st6" cx="125.5" cy="79.7" rx="3.6" ry="4.2" />
        <circle id="XMLID_17_" className="st8" cx="131.4" cy="60" r="2.2" />
        <circle id="XMLID_18_" className="st7" cx="145.6" cy="54.1" r="1.9" />
        <circle id="XMLID_19_" className="st6" cx="142.6" cy="32.4" r="2.1" />
      </g>
    </SquigglySVG>
    <g id="mask">
      <path id="XMLID_6_" className="st9" d="M83.8,109.2c20.4,5.6,40.8-7.4,40.8-7.4s-0.6,20.6-4.6,21.6c-4,1-37.7,5.6-37.7,5.6" />
    </g>
  </svg>,
  document.getElementById('app')
);
