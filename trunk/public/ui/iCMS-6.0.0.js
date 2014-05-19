(function($) {
    window.iCMS = {
        config:{'COOKIE_PRE':'iCMS_'},
        user:{
            uid:function(){
                return iCMS.getcookie('userid');
            },
            nickname:function(){
                var nickname = iCMS.getcookie('nickname');
                return unescape(nickname.replace(/\\u/gi, '%u'));
            },
            auth:function(){
                return iCMS.getcookie('AUTH_INFO');
            },
            data:function(a){
                $.get(iCMS.api('user')+"&do=data", a,function(c) {
                    //if(!c.code) return false;
                    var userhome = $(".iCMS_user_home")
                    userhome.attr("href",c.url);
                    $(".avatar",userhome).attr("src",c.avatar);
                    $(".name",userhome).text(c.nickname);
                },'json');  
            },
            logout:function() {
                $.get(iCMS.api('user')+"&do=logout",function(c) {
                    window.location.href = c.forward
                },'json');   
            },
            status:function() {
                return iCMS.getcookie('AUTH_INFO') ? true : false;
            },
            follow:function(a){
                var b = $(a),param = iCMS.param(b);
                param['follow'] = b.hasClass('follow')?1:0;
                $.get(iCMS.api('user')+"&do=follow",param,function(c) {
                    if(c.code){
                        b.removeClass((param['follow']?'follow':'unfollow'));
                        b.addClass((!param['follow']?'follow':'unfollow'));   
                    }else{
                        iCMS.alert(c.msg);
                        //iCMS.dialog(c.msg);
                        return false;
                    }
                    // window.location.href = c.forward
                },'json');
            },
            avatar:function(size, uid) {
                size = size || 24;
                uid  = uid || iCMS.user.uid;
                var nuid = pad(uid,7),
                dir1     = nuid.substr(0, 3),
                dir2     = nuid.substr(3, 2);
                avatar   = this.config.avatar + dir1 + '/'+ dir2 + '/' + uid + '.jpg_' + size + 'x' + size + '.jpg';
                return avatar;
            },
        }, 
        article:{
            good:function(a){
                var b=$(a),p = b.parent(),param = iCMS.param(p);
                param['do'] = 'good';
                $.get(iCMS.api('article'),param,function(c) {
                    if(c.code){
                        var count = parseInt($('span',b).text());
                        $('span',b).text(count+1);                            
                        iCMS.dialog(c.msg);
                    }else{
                        iCMS.alert(c.msg);
                        return false;
                    }
                },'json');
            },
            comment_box:function(a){
                var b = $(a),pp = b.parent().parent(),p = b.parent(),
                param = iCMS.param(p),def ='写下你的评论…',
                box   = $('.zm-comment-box',pp);
                if(box.length >0){
                    box.remove();
                    return false;
                }
                // console.log(param);

                spike = '<i class="iCMS-icon iCMS-icon-spike zm-comment-bubble" style="display: inline; left: 481px;"></i>',
                box   = $('<div class="zm-comment-box">'),
                list  = $('<div class="zm-comment-list">'),
                form  = $('<div class="zm-comment-form">');
                form.html('<div class="zm-comment-ipt">'+
                    '<input class="zm-comment-textarea" type="text" value="'+def+'">'+
                    '</div>'+
                    '<div class="zm-command clearfix">'+
                    '<a href="#" name="addnew" class="btn btn-primary">评论</a>'+
                    '<a href="###" name="closeform" class="zm-command-cancel">取消</a>'+
                    '</div>'
                );
                box.append(spike,list,form);
                p.after(box);
                //加载评论
                comment_list();

                //----------绑定事件----------------
                $('.zm-comment-textarea',box).focus(function() {
                    form.addClass('expanded');
                   if(this.value==def) this.value='';
                   
                    $(this).css({color: '#222'});  
                }).blur(function() {
                    close_form();
                });

                //关闭评论
                $('a[name="closeform"]',box).click(function(event) {
                    event.preventDefault();
                    form.removeClass('expanded');
                    close_form(true);
                });
                //提交评论
                box.on('click', 'a[name="addnew"]', function(event) {
                //$('a[name="addnew"]',box).click(function() {
                    event.preventDefault();
                    var ta = $('.zm-comment-textarea',box),
                    param  = comment_param(ta);

                    console.log(param);
                    return;

                    if(!param.content){
                        iCMS.alert("请填写内容");
                        ta.focus();
                        return false;
                    }
                    $.post(iCMS.api('article'),param,function(c) {
//                        console.log(c);
                        if(c.code){
                            var count = parseInt($('span',b).text());
                            $('span',b).text(count+1);
                            ta.val(def).css({color: '#222'});
                            comment_list(c.forward);
                        }else{
                            iCMS.alert(c.msg);
                        }
                    },'json'); 
                });
                //回复评论
                list.on('click', 'a[name="reply_comment"]', function(event) {
                    event.preventDefault();
                    var item    = $(this).parent().parent(),
                    reply_param = iCMS.param($(this)),
                    item_form   = $('.zm-comment-form',item);

                    if(item_form.length >0){
                        item_form.remove();
                        return false;
                    }             
                    item_form = form.clone();    
                    item_form.addClass('expanded').removeClass('zm-comment-box-ft');
                    $(this).parent().after(item_form);


                    $('.zm-comment-textarea',item_form).data('param',reply_param).val("").focus();
                    $('a[name="closeform"]',item_form).click(function(event) {
                        event.preventDefault();
                        item_form.remove();
                    });
                });
                //赞评论
                list.on('click', 'a[name="like_comment"]', function(event) {
                    event.preventDefault();
                    alert("like_comment");
                });

                // function comment_up(){

                // }

                function comment_param(ta){
                    var data = ta.data('param'),
                    content  = ta.val(),
                    vars     = {
                        'action':'comment',
                        'content':(content==def?'':content),
                    };
                    console.log(vars,param,data);
                    
                    return $.extend(vars,param,data);
                }
                function close_form(d,p){
                    var ta = $('.zm-comment-textarea',(p||box));
                    if(ta.val()==""||d){
                        ta.val(def).css({color: '#999'});
                   }                   
                }
                function comment_list(id){
                    $.get(iCMS.api('article')+"&do=comment",{'iid':param['iid'],'id':id},
                        function(json) {
                            if(!json) return false;

                            form.addClass('zm-comment-box-ft');
                            $.each(json,function(i,c) {
                                //console.log(c.up>1);
                                var item = '<div class="zm-item-comment" data-id="'+c.id+'">'+
                                '<a title="'+c.user.name+'" data-tip="iCMS:ucard:'+c.user.uid+'" class="zm-item-link-avatar" href="'+c.user.url+'">'+
                                '<img src="'+c.user.avatar+'" class="zm-item-img-avatar">'+
                                '</a>'+
                                '<div class="zm-comment-content-wrap">'+
                                '<div class="zm-comment-hd">'+
                                '<a data-tip="iCMS:ucard:'+c.user.uid+'" href="'+c.user.url+'" class="zg-link">'+c.user.name+'</a>'+
                                '</div>'+
                                '<div class="zm-comment-content">'+c.content+'</div>'+
                                '<div class="zm-comment-ft">'+
                                '<span class="date">'+c.addtime+'</span>'+
                                '<a href="#" class="reply zm-comment-op-link" name="reply_comment" data-param=\'{"uid":"'+c.user.uid+'","name":"'+c.user.name+'"}\'>'+
                                '<i class="iCMS-icon iCMS-icon-comment-reply"></i>回复</a>'+
                                '<a href="#" class="like zm-comment-op-link" name="like_comment">'+
                                '<i class="iCMS-icon iCMS-icon-comment-like"></i>赞</a>';
                                if(c.up>1){
                                    item += '<span class="like-num" data-tip="iCMS:s:'+c.up+' 人觉得这个很赞">'+
                                            '<em>'+c.up+'</em> <span>赞</span></span>';
                                }
                                item += '<a href="#" name="report" class="report zm-comment-op-link needsfocus">'+
                                '<i class="iCMS-icon iCMS-icon-no-help"></i>举报</a>'+
                                '</div>'+
                                '</div>'+
                                '</div>';
                                list.append(item);
                            });
                    },'json');                    
                }
               //------------
            }
        },
        param:function(a){
            return $.parseJSON(a.attr('data-param'));
        },
        api:function(app){
            return iCMS.config.API+'?app='+app;
        },
    	Init:function(){
            this.user_status = this.user.status();
            // console.log(this.user_status);
            if(this.user_status){
                this.user.data();
                //this.userinfo();
                $("#iCMS_nav_login").hide();
                $("#iCMS_nav_profile").show();
                this.hover(".iCMS_user_home", "#iCMS_user_menu",21);
            }
            $(document).on("click",'.iCMS_user_follow',function(event) {
                event.preventDefault();
                if(!iCMS.user_status){
                    iCMS.LoginBox(); 
                    return false;
                }
                iCMS.user.follow(this);
                return false;
            });
            $(document).on("click",'.iCMS_article_do',function(event) {
                event.preventDefault();
                if(!iCMS.user_status){
                    iCMS.LoginBox(); 
                    return false;
                }
                var param = iCMS.param($(this));
                if(param.do=='comment'){
                    iCMS.article.comment_box(this);
                }else if(param.do=='good'){
                    iCMS.article.good(this);
                }
                return false;
            });
            $(document).on("click",'.iCMS_user_logout',function(event) {
                event.preventDefault();
                iCMS.user.logout();
                return false;
            });
            $(document).on("click",'.iCMS_LoginBox',function(event) {
            	event.preventDefault();
                iCMS.LoginBox();
                return false;
            });

            $("#iCMS_seccode_img,#iCMS_seccode_text").click(function(){
                $("#iCMS_seccode_img").attr('src',iCMS.api('public')+'?app=public&do=seccode&'+Math.random());
            });
            $(".iCMS_API_iframe").load(function(){ 
                $(this).height(0); //用于每次刷新时控制IFRAME高度初始化 
                var height = $(this).contents().height(); 
                $(this).height(height); 
            }); 
    	},
        alert:function(msg){
            iCMS.dialog(msg,{label:'warning',icon:'warning'});
        },
        dialog:function(msg,options,_parent){
            var a    = window,
            defaults = {width: 360,height: 150,fixed: true,lock: true,time:3000,label:'success',icon:'check'},            
            opts     = $.extend(defaults,options);
            _parent  = _parent||false;
            //console.log(opts);
            if(_parent) a = window.parent
 
            var dialog   = a.$.dialog({
                id: 'iPHP_DIALOG',width:opts.width,height:opts.height,fixed:opts.fixed,lock:opts.lock,time:opts.time,
                title: 'iCMS - 提示信息',
                content: '<div class=\"iPHP-msg\"><span class=\"label label-'+opts.label+'\"><i class=\"fa fa-'+opts.icon+'\"></i> '+msg+'</span></div>',
            });
        },
        LoginBox:function(){
            var loginBox    = $('#iCMS_Login_Box');
            //console.log(typeof(loginBox));
            window.iCMS_Login_MODAL = $(this).modal({width:"560px",height: "240px",html:loginBox,scroll:true});
        },

        hover:function(a, b, t, l) {
            var timeOutID = null;
            t = t || 0, l = l || 0;
            $(a).hover(function() {
                var position = $(this).position();
                $(b).show().css({top: position.top + t,left: position.left + l});
            }, function() {
                timeOutID = setTimeout(function() {
                    $(b).hide();
                }, 1000);
            });
            $(b).hover(function() {
                window.clearTimeout(timeOutID);
                $(this).show();
            }, function() {
                $(this).hide();
            });
        },
        modal: function() {
            $('[data-toggle="modal"]').on("click", function(event) {
            	event.preventDefault();
                window.iCMS_MODAL = $(this).modal({width: "85%",height: "640px"});
                //$(this).parent().parent().parent().removeClass("open");
                return false;
            });
        },
        setcookie: function(cookieName, cookieValue, seconds, path, domain, secure) {
            var expires = new Date();
            expires.setTime(expires.getTime() + seconds);
            cookieName = this.config.COOKIE_PRE+'_'+cookieName;
            document.cookie = escape(cookieName) + '=' + escape(cookieValue) 
            + (expires ? '; expires=' + expires.toGMTString() : '') 
            + (path ? '; path=' + path : '/') 
            + (domain ? '; domain=' + domain : '') 
            + (secure ? '; secure' : '');
        },
        getcookie: function(name) {
            name             = this.config.COOKIE_PRE+'_'+name;
            var cookie_start = document.cookie.indexOf(name);
            var cookie_end   = document.cookie.indexOf(";", cookie_start);
            return cookie_start == -1 ? '' : unescape(document.cookie.substring(cookie_start + name.length + 1, (cookie_end > cookie_start ? cookie_end : document.cookie.length)));
        },
        random: function(len) {
    	    len = len||16;
    	    var chars 	= "abcdefhjmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWYXZ",code	= '';
    	    for ( i = 0; i < len; i++ ) {
    	        code += chars.charAt( Math.floor( Math.random() * chars.length ) )
    	    }
    	    return code;
    	},
    	imgFix:function (im, x, y) {
    	    x = x || 99999
    	    y = y || 99999
    	    im.removeAttribute("width");
    	    im.removeAttribute("height");
    	    if (im.width / im.height > x / y && im.width > x) {
    	        im.height = im.height * (x / im.width)
    	        im.width = x
    	        im.parentNode.style.height = im.height * (x / im.width) + 'px'
    	    } else if (im.width / im.height <= x / y && im.height > y) {
    	        im.width = im.width * (y / im.height)
    	        im.height = y
    	        im.parentNode.style.height = y + 'px'
    	    }
    	}
    };
})(jQuery);

(function($) {
    $.fn.modal = function(options) {
        var im = $(this), 
        defaults = {
            width: "360px",height: "300px",
            title: im.attr('title') || "iCMS 提示",
            href: im.attr('href')||false,
            target: im.attr('data-target') || "#iCMS_MODAL",
            zIndex: im.attr('data-zIndex')||false,
            overflow: im.attr('data-overflow')||false,
        };
      
        var meta = im.attr('data-meta')?$.parseJSON(im.attr('data-meta')):{};
        var opts = $.extend(defaults,options,meta);
        var mOverlay = $('<div id="modal-overlay" class="modal-overlayBG"></div>');

        return im.each(function() {

            var m = $(opts.target), 
            mBody = m.find(".modal-body"), 
            mTitle = m.find(".modal-header h3");
            opts.title && mTitle.html(opts.title);
            mBody.empty();

            if(opts.overflow){
                $("body").css({"overflow-y": "hidden"});
            }
            
            if (opts.html) {
                var html = opts.html;
                if(typeof(opts.html)=="object"){
                    html = opts.html.html();
                }
                mBody.html(html).css({"overflow-y": "auto"});
            } else if (opts.href) {
                var mFrame = $('<iframe class="modal-iframe" frameborder="no" allowtransparency="true" scrolling="auto" hidefocus="" src="' + opts.href + '"></iframe>');
                mFrameFix = $('<div id="modal-iframeFix" class="modal-iframeFix"></div>');
                mFrame.appendTo(mBody);
                mFrameFix.appendTo(mBody);
            }
            mOverlay.insertBefore(m).click(function() {
                im.destroy();
            });
            $('[data-dismiss="modal"][aria-hidden="true"]').on('click', function() {
                im.destroy();
            });
            im.size = function(o) {
                var opts = $.extend(opts, o);
                opts.zIndex && m.css({"cssText":'z-index:'+opts.zIndex + '!important'});
                m.css({width: opts.width});
                mBody.height(opts.height);
                var left = ($(window).width() - m.width()) / 2, 
                top = ($(window).height() - m.height()) / 2;
                m.css({left: left + "px",top: top + "px"})
                .css({"position": "fixed"});
                
            //console.log({left:left+"px",top:top+"px"});

            };
            im.destroy = function() {
                window.stop ? window.stop() : document.execCommand("Stop");
                m.hide();
                mOverlay.remove();
                m.find(".modal-header h3").html("iCMS 提示");
                if(opts.overflow){
                    $("body").css({"overflow-y": "auto"});
                }
            };
            im.size(opts);
            m.show();
            return im;
        });
    }
})(jQuery);

function pad(num, n) {  
    num=num.toString();
    return Array(n>num.length?(n-(''+num).length+1):0).join(0)+num;  
}