	/************
	 Classes to set up the drop-down control
	 ************/
          
    function optionDiv(options){
   	  var control = document.createElement('DIV');
   	  control.className = "dropDownItemDiv";
   	  control.title = options.title;
   	  control.id = options.id;
   	  control.innerHTML = options.name;
   	  google.maps.event.addDomListener(control,'click',options.action);
   	  return control;
     }
     
     function checkBox(options){
     	//first make the outer container
     	var container = document.createElement('DIV');
   	  	container.className = "checkboxContainer";
   	  	container.title = options.title;
   	  	
     	var span = document.createElement('SPAN');
     	span.role = "checkbox";
     	span.className = "checkboxSpan";
     	        	        	
     	var bDiv = document.createElement('DIV');
   	  	bDiv.className = "blankDiv";      	  	
   	  	bDiv.id = options.id;
   	  	
   	  	var image = document.createElement('IMG');
   	  	image.className = "blankImg";
   	  	image.src = "http://maps.gstatic.com/mapfiles/mv/imgs8.png";
   	  	
   	  	var label = document.createElement('LABEL');
   	  	label.className = "checkboxLabel";
   	  	label.innerHTML = options.label;
   	  	
   	  	bDiv.appendChild(image);
   	  	span.appendChild(bDiv);
   	  	container.appendChild(span);
   	  	container.appendChild(label);
   	  	
		bDiv.style.display=options.status; // default status
			
		
   	  	google.maps.event.addDomListener(container,'click',function(){
   	  		(document.getElementById(bDiv.id).style.display == 'block') ? document.getElementById(bDiv.id).style.display = 'none' : document.getElementById(bDiv.id).style.display = 'block';
   	  		//(this.checked == true) ? this.checked = flase : this.checked == true;
   	  		
			options.action(); 
   	  	})
   	  	return container;
     }
     function separator(){
     		var sep = document.createElement('DIV');
     		sep.className = "separatorDiv";
     		return sep;      		
     }
     
     function dropDownOptionsDiv(options){
    	//alert(options.items[1]);
      	var container = document.createElement('DIV');
      	container.className = "dropDownOptionsDiv";
      	container.id = options.id;
      	
      	
      	for(i=0; i<options.items.length; i++){
      		//alert(options.items[i]);
      		container.appendChild(options.items[i]);
      	}
      	
      	//for(item in options.items){
      		//container.appendChild(item);
      		//alert(item);
      	//}        
 		return container;        	
      }
     
     function dropDownControl(options){
    	  var container = document.createElement('DIV');
    	  container.className = 'container1';
    	  
    	  var control = document.createElement('DIV');
    	  control.className = 'dropDownControl';
    	  control.innerHTML = options.name;
    	  control.id = options.name;
    	  var arrow = document.createElement('IMG');
    	  arrow.src = "http://maps.gstatic.com/mapfiles/arrow-down.png";
    	  arrow.className = 'dropDownArrow';
    	  control.appendChild(arrow);	      		
    	  container.appendChild(control);    
    	  container.appendChild(options.dropDown);
    	  
    	  //options.gmap.controls[options.position].push(container);
    	  google.maps.event.addDomListener(container,'click',function(){
    		
			(document.getElementById(options.dropDown.id).style.display == 'block') ? document.getElementById(options.dropDown.id).style.display = 'none' : document.getElementById(options.dropDown.id).style.display = 'block';
    		
			/*  removed timeout
			
			setTimeout( function(){
    			document.getElementById(options.dropDown.id).style.display = 'none';
    		}, 2400);
			
			*/
			
			
			
    	  })  
			
		return container; 	
      }
     
     function buttonControl(options) {
         var control = document.createElement('DIV');
         control.innerHTML = options.name;
         control.className = 'button';
         control.index = 1;

         // Add the control to the map
         options.gmap.controls[options.position].push(control);

         // When the button is clicked pan to sydney
         google.maps.event.addDomListener(control, 'click', options.action);
         return control;
     }
	 
	 
	 /////////////////// NEW ///////////////////////////////////////////////
	 function mainMenuControl(options) {
		  var container = document.createElement('DIV');
    	  container.className = 'mainmenu1';
    	  
    			 
		  var control = document.createElement('DIV');
		  control.className = 'container1';   	 
		  control.id = options.id; 
		  control.title = options.title; 
		  control.name = options.name; 	  
			 
			for(i=0; i<options.items.length; i++){
				//alert(options.items[i]);
				control.appendChild(options.items[i]);
				
			} 
		
		container.appendChild(control);    
		options.gmap.controls[options.position].push(container); 
		 
		 
	 }	 