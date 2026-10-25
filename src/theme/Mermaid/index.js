import React, {useEffect, useRef, useState} from 'react';
import Mermaid from '@theme-original/Mermaid';

// Preserve legible labels instead of shrinking wide diagrams to the phone width.
export default function ReadableMermaid(props) {
  const viewport = useRef(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const container = viewport.current;
    const measure = () => {
      const svg = container.querySelector('svg');
      if (!svg) return;
      const width = svg.viewBox.baseVal.width;
      if (width > 0) svg.style.minWidth = `${Math.ceil(width * 0.85)}px`;
      setScrollable(container.scrollWidth > container.clientWidth + 1);
    };
    const mutations = new MutationObserver(measure);
    const resize = new ResizeObserver(measure);
    mutations.observe(container, {childList: true, subtree: true});
    resize.observe(container);
    measure();
    return () => {
      mutations.disconnect();
      resize.disconnect();
    };
  }, [props.value]);

  return (
    <div className="book-diagram">
      {scrollable && <p className="book-diagram__hint">Scroll horizontally to read the full diagram.</p>}
      <div
        ref={viewport}
        className="book-diagram__viewport"
        role={scrollable ? 'region' : undefined}
        aria-label={scrollable ? 'Scrollable diagram' : undefined}
        tabIndex={scrollable ? 0 : undefined}>
        <Mermaid {...props} />
      </div>
    </div>
  );
}
