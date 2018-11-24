const html = String.raw
const getIscaleUrl = (e, t, i, s, dt) => {
  if (0) {
    return window.imgMinUrl
  }
  console.log('dt', dt)
  if (dt) {
    if (dt > 600) {
      console.log(1)
      s = 5
    } else if (dt > 300) {
      console.log(2)
      s = s / 3
    }
    console.log(s)
  }
  return `https://img-scale.now.sh?format=${t}&width=${
    (i = Math.floor(i)) > 50 ? i - (i % 50) : i - (i % 5)
  }&url=${encodeURIComponent(e)}&quality=${s}`
}
let invisibles = []

let active
const onScroll = () => {
  if (!active && invisibles.length > 0) {
    active = true
    setTimeout(() => {
      invisibles.forEach(e => e.checkVisibility())
      invisibles = invisibles.filter(e => !e.visible)
      active = false
    }, 200)
  }
}
const template = html`
  <picture>
    <source type="image/webp" />
    <source type="image/jpeg" />
    <img part="img" />
  </picture>
  <style>
    picture,
    img {
      display: block;
      width: 100%;
    }

    picture {
      overflow: hidden;
      padding-top: 66%;
      position: relative;
    }
    img {
      position: absolute;
      opacity: 0;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      filter: blur(15px);
      transform: scale(1.03);
      transition: all 0.7s ease-in-out;
    }
    :host {
      display: block;
      background: #fffaf4;
      overflow: hidden;
    }

    :host([preview]),
    :host([loaded]) {
      background: none;
    }

    :host([preview]) img {
      opacity: 1;
    }

    :host([loaded]) img {
      opacity: 1;
      filter: blur(0px);
      transform: scale(1);
    }
  </style>
`
const getPaddingTop = e => {
  const [, t, i] = e.match(/([0-9]*\.?[0-9]*)\/([0-9]*\.?[0-9]*)/),
    s = parseFloat(t)
  return `${(100 * parseFloat(i)) / s}%`
}
let postponedHighres = []
const pendingPreviews = {}
let isOnScrollInit
customElements.define(
  'img-min',
  class extends HTMLElement {
    constructor() {
      super()
      if (!isOnScrollInit) {
        isOnScrollInit = true
        document.addEventListener('scroll', onScroll)
      }

      invisibles.push(this)
      this.maxWidth = 0
      const shadowRoot = this.attachShadow({
        mode: 'open'
      })
      shadowRoot.innerHTML = template
      this.picture = shadowRoot.querySelector('picture')

      this.img = this.shadowRoot.querySelector('img')
      const onHighresLoaded = () => {
        this.removeAttribute('preview')
        this.setAttribute('loaded', '')
        this.img.onload = null
      }
      const onPreviewLoaded = e => {
        console.log(e)
        this.previewLoadTime = Date.now() - this.previewStartTime
        delete pendingPreviews[this.getAttribute('src')]
        this.setAttribute('preview', '')
        postponedHighres.push(() => this.resize())
        if (Object.keys(pendingPreviews).length === 0) {
          postponedHighres.reverse().forEach(e => e())
          postponedHighres = []
        }
        this.img.onload = onHighresLoaded
      }
      this.img.onload = onPreviewLoaded
      this.resize = this.resize.bind(this)
      addEventListener('resize', this.resize)
    }

    static get observedAttributes() {
      return ['src', 'quality']
    }

    get src() {
      return this.getAttribute('src')
    }

    get quality() {
      return this.getAttribute('quality') || 50
    }

    set quality(quality) {
      this.setAttribute('quality', quality)
      console.log('q', quality)
      this.updateSrcset()
    }

    set src(url) {
      this.setAttribute('src', url)
      this.updateSrcset()
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return
      this[name] = newValue
    }

    updateSrcset() {
      if (!this.visible) {
        return
      }
      this.jpeg =
        this.jpeg || this.shadowRoot.querySelector('source[type="image/jpeg"]')
      this.jpeg.srcset = getIscaleUrl(
        this.src,
        'jpeg',
        this.width,
        this.quality,
        this.previewLoadTime
      )
      this.webp =
        this.webp || this.shadowRoot.querySelector('source[type="image/webp"]')
      this.webp.srcset = `${getIscaleUrl(
        this.src,
        'webp',
        this.width,
        this.quality,
        this.previewLoadTime
      )} 1x,${getIscaleUrl(
        this.src,
        'webp',
        this.width * 1.3,
        this.quality,
        this.previewLoadTime
      )} 2x`
    }

    get width() {
      return this._width
    }

    set width(width) {
      this._width = width
      this.updateSrcset()
    }

    disconnectedCallback() {
      removeEventListener('resize', this.resize)
    }
    loadPreview(width) {
      pendingPreviews[this.src] = true
      this.previewStartTime = Date.now()
      this.width = Math.max(10, width / 7)
      console.log('comple', this.img.complete)
    }
    checkVisibility() {
      const dist = parseInt(this.getAttribute('lazy-dist')) || 100
      const { top, bottom, width } = this.getBoundingClientRect()
      const isAbove = bottom < -dist
      const isBelow = top > window.innerHeight + dist
      if (!isAbove && !isBelow && !this.visible) {
        this.visible = true
        this.loadPreview(width)
      }
    }
    resize() {
      if (!this.visible) {
        return
      }
      cancelAnimationFrame(this.af)
      this.af = requestAnimationFrame(() => {
        const { width } = this.picture.getBoundingClientRect()
        if (width > this.maxWidth) {
          this.maxWidth = width
          this.width = width
        }
      })
    }
    connectedCallback() {
      const e = this.getAttribute('aspect')
      e &&
        ((this.img.style.height = '100%'),
        (this.img.style.objectFit = 'cover'),
        (this.picture.style.paddingTop = getPaddingTop(e))),
        setTimeout(() => {
          this.checkVisibility()
        }, 100)
    }
  }
)
