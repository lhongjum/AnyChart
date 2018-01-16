if(!_.waterfall){_.waterfall=1;(function($){var H_=function(a,b,c,d,e){$.qx.call(this,a,b,c,d,e)},I_=function(){$.Mx.call(this);this.R="waterfall";$.vo(this.F,[["dataMode",0,1],["connectorStroke",0,1]])},J_=function(a,b){var c=a.Ya().transform(b),d=a.g,e;a.Lq()?(e=d.left,d=d.width):(e=d.Ma(),d=-d.height);return e+c*d},K_=function(a,b){for(var c=a.length;c--;){var d=a[c].data;if(d.length&&!d[b].G.missing)return c}return window.NaN},L_=function(a){$.Jw.call(this,a)},M_=function(a){var b=new I_;b.ra(!0,$.dl("waterfall"));for(var c=0,d=arguments.length;c<
d;c++)b.waterfall(arguments[c]);return b},qga={pea:"absolute",Mfa:"diff"};$.G(H_,$.qx);$.g=H_.prototype;$.g.ax={"%BubbleSize":"size","%RangeStart":"low","%RangeEnd":"high","%XValue":"x","%Diff":"diff","%Absolute":"absolute","%IsTotal":"isTotal"};$.g.ep=function(a,b){var c=H_.J.ep.call(this,a,b);c.diff={value:b.G("diff"),type:"number"};c.absolute={value:b.G("absolute"),type:"number"};c.isTotal={value:b.G("isTotal"),type:""};return c};$.g.eU=function(){return{prevValue:0,NT:!1,aba:"absolute"==this.Ba.N("dataMode")}};
$.g.oV=function(a,b,c){var d=-1<(0,$.Ta)(this.ca||[],b.G.rawIndex);a=a.get("isTotal");var d=!!b.G.missing||d,e=!(c.NT||d);a=e||($.n(a)?!!a:d);!d||!e&&a?(d=c.aba?d?c.prevValue:+b.data.value:c.prevValue+(d?0:+b.data.value),b.G.absolute=d,b.G.diff=d-c.prevValue,b.G.isTotal=a,b.G.missing=0,c.NT=!0,c.prevValue=d):b.G.missing=1};$.g.FJ=function(a){return"value"==a?0<=(Number(this.la().G("diff"))||0):H_.J.FJ.call(this,a)};$.G(I_,$.Mx);var N_={};N_.waterfall={sb:32,zb:2,Ab:[$.GB,$.IB,$.JB,$.LB,$.OB,$.BB],xb:null,ub:null,rb:$.mx|5767168,qb:"value",pb:"zero"};I_.prototype.Pg=N_;$.zv(I_,I_.prototype.Pg);$.g=I_.prototype;$.g.sn=function(){return"waterfall"};$.g.vz=function(){return"value"};$.g.dn=function(){};$.g.xT=function(a){return+a.G[a.G.isTotal?"absolute":"diff"]};
$.g.pV=function(a,b,c,d){var e=0,f,h;if(b)for(f=0;f<a.length;f++)h=a[f].data[b-1],e+=Number(h.G.diff)||0;this.Sa=[];for(f=b;f<=c;f++){for(var k=b=0;k<a.length;k++)h=a[k].data[f],h.G.isTotal||(h.G.stackedZero+=e,h.G.stackedValue+=e,h.G.stackedZeroPrev+=e,h.G.stackedValuePrev+=e,h.G.stackedZeroNext+=e,h.G.stackedValueNext+=e),d.Uc(h.G.stackedValue),d.Uc(h.G.stackedValuePrev),d.Uc(h.G.stackedValueNext),b+=h.G.missing?0:Number(h.G.diff)||0;e+=b;this.Sa.push(e)}};
$.g.vO=function(){this.b?this.b.clear():this.b=$.mj();var a=this.Ra(),b=this.Ka[String($.qa(a))];if(b&&b.length){var c=this.N("connectorStroke");this.b.stroke(c);c=$.lc(c);this.b.parent(this.aa());this.b.zIndex(1E3);this.b.clip(this.Se());var d=this.Lq(),a=a.ar(),e=b[0].Ig,f=b[0].lastIndex,h,k,l,m,p;l=K_(b,e);(0,window.isNaN)(l)?h=k=window.NaN:(m=b[l],l=m.data[e].G,p=a?m.ha.jo($.n(l.category)?l.category:e):m.ha.un,k=$.pn(J_(this,this.Sa[0]),c),h=l.valueX+p/2);for(var q=e+1;q<=f;q++){a:{for(l=0;l<
b.length;l++)if(!b[l].data[q].G.missing)break a;l=window.NaN}(0,window.isNaN)(l)?l=m=window.NaN:(m=b[l],l=m.data[q].G,p=a?m.ha.jo($.n(l.category)?l.category:e):m.ha.un,m=$.pn(J_(this,this.Sa[q-e-1]),c),l=l.valueX-p/2);if(!(0,window.isNaN)(h)&&!(0,window.isNaN)(k))if((0,window.isNaN)(l)||(0,window.isNaN)(m))continue;else $.Hw(this.b,d,h,k),$.Iw(this.b,d,l,m);l=K_(b,q);(0,window.isNaN)(l)?h=k=window.NaN:(m=b[l],l=m.data[q].G,p=a?m.ha.jo($.n(l.category)?l.category:e):m.ha.un,k=$.pn(J_(this,this.Sa[q-
e]),c),h=l.valueX+p/2)}}};$.g.tp=function(a,b){return new H_(this,this,a,b,!0)};var O_={};$.R(O_,0,"dataMode",function(a,b){return $.sj(qga,a,b||"absolute")});$.R(O_,1,"connectorStroke",$.Po);$.Ho(I_,O_);$.g=I_.prototype;$.g.pn=function(){return!0};
$.g.mj=function(a,b){var c=[];if("categories"==a){this.K={};for(var d=this.Ce(),e,f,h,k={},l=0,m=0;m<d.length;m++)e=d[m],f=$.Vk("risingFill",1,!1),f=f(e,$.Xk,!0,!0),h=$.Nm(f),h in k?this.K[k[h]].ha.push(e):(k[h]=l,this.K[l]={ha:[e],type:"rising"},c.push({text:"Increase",iconEnabled:!0,iconFill:f,sourceUid:$.qa(this),sourceKey:l++})),f=$.Vk("fallingFill",1,!1),f=f(e,$.Xk,!0,!0),h=$.Nm(f),h in k?this.K[k[h]].ha.push(e):(k[h]=l,this.K[l]={ha:[e],type:"falling"},c.push({text:"Decrease",iconEnabled:!0,
iconFill:f,sourceUid:$.qa(this),sourceKey:l++})),f=$.Vk("fill",1,!1),f=f(e,$.Xk,!0,!0),h=$.Nm(f),h in k?this.K[k[h]].ha.push(e):(k[h]=l,this.K[l]={ha:[e],type:"total"},c.push({text:"Total",iconEnabled:!0,iconFill:f,sourceUid:$.qa(this),sourceKey:l++}))}else c=I_.J.mj.call(this,a,b);return c};
$.g.Cl=function(a,b){if("categories"==this.ee().kh())for(var c=a.Vf(),d=this.K[c],c=d.ha,d=d.type,e,f,h,k,l,m,p=0;p<c.length;p++){e=c[p];f=e.bf();for(m=[];f.advance();){var q=f.sa();f.G("missing")||(h=f.G("isTotal"),k=0<=f.G("diff")&&!h,l=0>f.G("diff")&&!h,(h=h&&"total"==d||k&&"rising"==d||l&&"falling"==d)&&m.push(q))}e.ih(m)}else return I_.J.Cl.call(this,a,b)};$.g.Bl=function(a,b){if("categories"==this.ee().kh())this.Zc();else return I_.J.Bl.call(this,a,b)};
$.g.zm=function(a,b){if("default"==this.ee().kh())return I_.J.zm.call(this,a,b)};$.g.O=function(){var a=I_.J.O.call(this);$.To(this,O_,a.chart);return a};$.g.fa=function(a,b){I_.J.fa.call(this,a,b);$.Ko(this,O_,a)};$.g.da=function(){$.K(this.b);I_.J.da.call(this)};var P_=I_.prototype;P_.xScale=P_.Ra;P_.yScale=P_.Ya;P_.crosshair=P_.Uo;P_.xGrid=P_.zs;P_.yGrid=P_.As;P_.xMinorGrid=P_.Tu;P_.yMinorGrid=P_.Uu;P_.xAxis=P_.Jq;P_.getXAxesCount=P_.Uv;P_.yAxis=P_.Vo;P_.getYAxesCount=P_.Wv;P_.getSeries=P_.ie;
P_.lineMarker=P_.ws;P_.rangeMarker=P_.xs;P_.textMarker=P_.ys;P_.palette=P_.hl;P_.markerPalette=P_.Mi;P_.hatchFillPalette=P_.em;P_.getType=P_.Xa;P_.addSeries=P_.Zj;P_.getSeriesAt=P_.gj;P_.getSeriesCount=P_.Kq;P_.removeSeries=P_.Yo;P_.removeSeriesAt=P_.Zo;P_.removeAllSeries=P_.Xo;P_.getPlotBounds=P_.Se;P_.xZoom=P_.Ji;P_.xScroller=P_.dl;P_.getStat=P_.pf;P_.annotations=P_.Lm;P_.getXScales=P_.mr;P_.getYScales=P_.nr;P_.data=P_.data;$.G(L_,$.ay);$.fB[32]=L_;$.g=L_.prototype;$.g.type=32;$.g.af=263713;$.g.uf={rising:"path",risingHatchFill:"path",falling:"path",fallingHatchFill:"path",path:"path",hatchFill:"path"};$.g.Mn=function(a){var b=a.G("shapes"),c;for(c in b)b[c].clear();c=0<=a.G("diff");var d;a.G("isTotal")?(c="path",d="hatchFill"):c?(c="rising",d="risingHatchFill"):(c="falling",d="fallingHatchFill");this.Zy(a,b[c],b[d])};
$.g.Ne=function(a,b){var c=0<=a.G("diff"),d;a.G("isTotal")?(c="path",d="hatchFill"):c?(c="rising",d="risingHatchFill"):(c="falling",d="fallingHatchFill");var e={};e[c]=e[d]=!0;e=this.yc.Fc(b,e);this.Zy(a,e[c],e[d])};$.Xn.waterfall=M_;$.F("anychart.waterfall",M_);}).call(this,$)}
