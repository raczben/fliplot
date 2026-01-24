/**
 * WebGL2 Utility for rendering lines and rectangles with transparency
 * This is a simple version which renders lines using triangles strip.
 */
export class WebGL2UtilTR {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { alpha: true });
    if (!this.gl) throw new Error("WebGL2 not supported");

    // Enable blending for transparency
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.vertexData = [];
    this.prevPoint = null;

    // Vertex shader
    const vsSource = `#version 300 es
        in vec2 aPosition;
        in vec4 aColor;
        uniform vec2 uCanvasSize;
        out vec4 vColor;
        void main(void) {
            // Convert pixel coords to NDC
            vec2 ndc = (aPosition / uCanvasSize) * 2.0 - 1.0;
            ndc.y = -ndc.y;
            gl_Position = vec4(ndc, 0.0, 1.0);
            vColor = aColor;
        }`;

    // Fragment shader
    const fsSource = `#version 300 es
        precision highp float;
        in vec4 vColor;
        out vec4 outColor;
        void main(void) {
            outColor = vColor;
        }`;

    // Compile shaders
    const vertexShader = this._loadShader(this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this._loadShader(this.gl.FRAGMENT_SHADER, fsSource);

    // Link program
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error("Shader program failed to link");
    }

    // Buffers
    const NOF_VERITICES = 2048;
    this.vertices_strip_len = 0;
    this.colors_strip_len = 0;
    this.vertices_strip = new Float32Array(NOF_VERITICES * 2); // x, y pairs
    this.colors_strip = new Float32Array(NOF_VERITICES * 4); // rgb colors
    this.vertices = [];
    this.colors = [];
    this.vertexBuffer = this.gl.createBuffer();
    this.colorBuffer = this.gl.createBuffer();

    // Uniform location
    this.uCanvasSizeLoc = this.gl.getUniformLocation(this.program, "uCanvasSize");
  }

  _loadShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(this.gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  /**
   * Add new vertices to the strip array.
   * @param {number} x
   * @param {number} y
   * @param {[number]} color
   */
  _add(x, y, color) {
    //check arguments
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      !Array.isArray(color) ||
      color.length !== 4
    ) {
      throw new Error("Invalid arguments for _add method");
    }

    this.vertices_strip[this.vertices_strip_len++] = x;
    this.vertices_strip[this.vertices_strip_len++] = y;
    for (let i = 0; i < 4; i++) {
      this.colors_strip[this.colors_strip_len++] = color[i];
    }

    // check if the arrays are full
    if (this.vertices_strip_len >= this.vertices_strip.length) {
      this.end_line();
      this.vertices_strip_len = 0;
      this.colors_strip_len = 0;
    }
  }

  /**
   * Begins a simple line from the given coordinates
   * @param {number} x
   * @param {number} y
   */
  begin_line(x, y) {
    this.prevPoint = [x, y];
  }

  /**
   * Draws a line from the previous point to the <x,y> coordinate.
   * If there is no previous point, throws an error.
   *
   * @param {number} x The horisontal position of the target coordinate
   * @param {number} y The vertical position of the target coordinate
   * @param {number} lineWidth
   * @param {[number]} color RGBA value array of the line color
   * @param {boolean} beginNew If true, begins a new line at the given point
   * @returns
   */
  line_to(x, y, lineWidth, color) {
    if (!this.prevPoint) throw new Error("line_to called before begin_line");

    const [x1, y1] = this.prevPoint;
    const [x2, y2] = [x, y];
    this.prevPoint = [x2, y2];

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = ((-dy / len) * lineWidth) / 2;
    const ny = ((dx / len) * lineWidth) / 2;

    const p1a = [x1 + nx, y1 + ny];
    const p1b = [x1 - nx, y1 - ny];
    const p2a = [x2 + nx, y2 + ny];
    const p2b = [x2 - nx, y2 - ny];

    this._add(...p1a, color);
    this._add(...p1b, color);
    this._add(...p2a, color);
    this._add(...p2b, color);
  }

  end_line() {
    const gl = this.gl;
    gl.useProgram(this.program);
    // Set canvas size uniform
    gl.uniform2f(this.uCanvasSizeLoc, this.canvas.width, this.canvas.height);

    // Vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices_strip, gl.STREAM_DRAW);
    const posLoc = gl.getAttribLocation(this.program, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors_strip, gl.STREAM_DRAW);
    const colorLoc = gl.getAttribLocation(this.program, "aColor");
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertices_strip_len / 2);

    this.vertices_strip_len = 0;
    this.colors_strip_len = 0;
  }

  add_rect(x1, y1, x2, y2, color) {
    // add two triangles
    this.vertices.push(
      x1,
      y1, // Bottom left
      x2,
      y1, // Bottom right
      x1,
      y2, // Top left
      x1,
      y2, // Top left
      x2,
      y1, // Bottom right
      x2,
      y2 // Top right
    );
    for (let i = 0; i < 6; i++) this.colors.push(...color);
  }

  draw() {
    const gl = this.gl;

    gl.useProgram(this.program);

    // Set canvas size uniform
    gl.uniform2f(this.uCanvasSizeLoc, this.canvas.width, this.canvas.height);

    // Vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STREAM_DRAW);
    const posLoc = gl.getAttribLocation(this.program, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STREAM_DRAW);
    const colorLoc = gl.getAttribLocation(this.program, "aColor");
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 2);

    this.vertices = [];
    this.colors = [];
  }

  clear() {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
}
