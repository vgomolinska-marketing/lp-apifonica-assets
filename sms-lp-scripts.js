// Count-up metrics
(function(){
  var seen=new WeakSet();
  function fmt(n,dec){var s=(dec?n.toFixed(1).replace('.',','):Math.round(n).toString());
    return s.replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
  function run(el){
    var target=parseFloat(el.getAttribute('data-count'));
    var suffix=el.getAttribute('data-suffix')||'';
    var dec=(el.getAttribute('data-count').indexOf('.')>-1);
    var start=null,dur=1400;
    function step(t){if(!start)start=t;var p=Math.min((t-start)/dur,1);
      var e=1-Math.pow(1-p,3);el.textContent=fmt(target*e,dec)+suffix;
      if(p<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);
  }
  var io=new IntersectionObserver(function(es){es.forEach(function(en){
    if(en.isIntersecting&&!seen.has(en.target)){seen.add(en.target);run(en.target);}});},{threshold:0.35});
  document.querySelectorAll('[data-count]').forEach(function(el){io.observe(el);});
})();

// Fit-check quiz
(function(){
  var answers={},total=4;
  document.querySelectorAll('.fit-opts').forEach(function(row){
    row.querySelectorAll('button').forEach(function(btn){
      btn.addEventListener('click',function(){
        row.querySelectorAll('button').forEach(function(b){b.classList.remove('on');});
        btn.classList.add('on');
        answers[row.getAttribute('data-q')]=parseInt(btn.getAttribute('data-v'),10);
        if(Object.keys(answers).length===total)show();
      });
    });
  });
  function show(){
    var score=Object.values(answers).reduce(function(a,b){return a+b;},0);
    document.getElementById('fitScore').textContent=score;
    var t,d;
    if(score>=3){t='Silne dopasowanie do komunikacji biznesowej';
      d='Twoje potrzeby odpowiadają temu, do czego stworzono naszą platformę. Porozmawiajmy, jak zwiększyć dotarcie do klientów.';}
    else if(score===2){t='Dobre dopasowanie';
      d='Widzimy realny potencjał dla komunikacji SMS w Twojej firmie. Pokażemy, od czego zacząć.';}
    else{t='Porozmawiajmy o Twoim przypadku';
      d='Nawet przy pojedynczych potrzebach SMS może przynieść wartość. Doradzimy najlepszą konfigurację.';}
    document.getElementById('fitTitle').textContent=t;
    document.getElementById('fitDesc').textContent=d;
    var r=document.getElementById('fitResult');r.classList.add('show');
    r.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
})();

// Carousel: arrows (looping) + mouse drag
document.querySelectorAll('.carousel').forEach(function(c){
  var track=c.querySelector('.carousel-track');
  c.querySelectorAll('.cbtn').forEach(function(b){
    b.addEventListener('click',function(){
      var dir=parseInt(b.getAttribute('data-dir'),10);
      var card=track.querySelector('.carousel-card');
      var step=card?card.getBoundingClientRect().width+20:340;
      var max=track.scrollWidth-track.clientWidth;
      if(dir>0 && track.scrollLeft>=max-4){track.scrollTo({left:0,behavior:'smooth'});}
      else if(dir<0 && track.scrollLeft<=4){track.scrollTo({left:max,behavior:'smooth'});}
      else{track.scrollBy({left:dir*step,behavior:'smooth'});}
    });
  });
  var down=false,startX=0,startLeft=0,moved=false;
  track.addEventListener('pointerdown',function(e){
    down=true;moved=false;startX=e.clientX;startLeft=track.scrollLeft;
    track.classList.add('dragging');
    try{track.setPointerCapture(e.pointerId);}catch(_){}
  });
  track.addEventListener('pointermove',function(e){
    if(!down)return;
    var dx=e.clientX-startX;
    if(Math.abs(dx)>3)moved=true;
    track.scrollLeft=startLeft-dx;
  });
  function end(){down=false;track.classList.remove('dragging');}
  track.addEventListener('pointerup',end);
  track.addEventListener('pointercancel',end);
  track.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();}},true);
});
