import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View,TouchableOpacity, ScrollView, Alert} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Icon,Divider, SpeedDial,Overlay,Button} from 'react-native-elements';
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";

var tasks = [];
var setTasks = [];
var combined = []

export default class HomeScreen extends React.Component {
  availableTime = 0
  intervalID

  state = {
    open:false,
    ready: false,
    taskIndex: 0,
    selectable: true,
    firstTime: false,
    sTask: null,
  };
  //get data
  componentDidMount(){
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
      this.getData();  
    });
    // this.getData()
    this.getSelectable()
    this.intervalID=setInterval(
      () => {this.makeCombined()},
      10000
    );
  }
  
  getData = async () => {
    this.savedTasks()
    this.savedSetTasks()
    this.firstTime()
    this.changeDay()
    this.makeCombined()
    this.setState({ready: true})
  } 

  async firstTime(){
    try {
      const JsonValue = await AsyncStorage.getItem('firsty')
      var first = JsonValue != null ? JSON.parse(JsonValue) :null;
      if(first==null){
        this.setState({firstTime: true,ready:true})
        const jsonValue = JSON.stringify(false)
        await AsyncStorage.setItem('firsty', jsonValue)
      }
      // this.setState({ready:true})
    }catch(e) {
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  }
  async savedTasks(){
    try {
      const JsonValue = await AsyncStorage.getItem('firsty')
      var first = JsonValue != null ? JSON.parse(JsonValue) :true;
      const dayJsonValue = await AsyncStorage.getItem('day')
      var day = dayJsonValue != null ? JSON.parse(dayJsonValue) :null;
      var oldTasks=[]
      const savedTaskJsonValue = await AsyncStorage.getItem('tasks')
      var savedTask = savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) :null;

      if(first){
        day = null;
        savedTask = null;
      }
      
      var needUpdate = false;
      //Set up savedTask
      if(savedTask == null){
        needUpdate = true
        savedTask = [new Array(7),new Array(7)]
        savedTask.forEach(element => {
          for (let i = 0; i < element.length; i++) {
            element[i] = []
          }
        });
      }
      //If it is a new day
      if (day != null&&new Date(new Date().setHours(0,0,0,0)).getTime()!=new Date(day).getTime()) {
        oldTasks = [...savedTask[0][new Date(day).getDay()]]
        //If it is a new week, set the week's tasks to the weekly ones
        if(new Date(new Date().setHours(0,0,0,0)).getTime()-new Date(day).getTime()>(new Date().getDay()-new Date(day).getDay())*1000*60*60*24){
          savedTask[0]=[...savedTask[1]]
        }

        //Shift due dates
        savedTask[0][new Date().getDay()].forEach(e => {
          if(e.repeating = true) 
          {
            var d = new Date().setHours(0,0,0,0)
            e.date = new Date(new Date(d).getTime()+e.dueIncrease)
            e.sortValue =this.updateSortValue(e)
          }
        });
        //Remove or edit recuring tasks
        for(let i=0;i<oldTasks.length;i++){
          var newIndex = savedTask[0][new Date().getDay()].findIndex((element)=>element.name==oldTasks[i].name)
          if(newIndex!=-1){
            if(savedTask[0][new Date().getDay()][newIndex].overridable){
              oldTasks.splice(i,1)
              i--
            }
            else{
              savedTask[0][new Date().getDay()][newIndex].length=parseInt(savedTask[0][new Date().getDay()][newIndex].length)
              oldTasks[i].length = parseInt(oldTasks[i].length)
              savedTask[0][new Date().getDay()][newIndex].length+=oldTasks[i].length
              // savedTask[0][new Date().getDay()][newIndex].date=new Date((new Date(savedTask[0][new Date().getDay()][newIndex].date).getTime()+new Date(oldTasks[i].date).getTime())/2)
              savedTask[0][new Date().getDay()][newIndex].sortValue = this.updateSortValue(savedTask[0][new Date().getDay()][newIndex])
              oldTasks.splice(i,1)
              i--
              savedTask[0][new Date().getDay()][newIndex].repeating = false
            }
          }
        }
        tasks=oldTasks.concat(savedTask[0][new Date().getDay()])
        savedTask[0][new Date().getDay()] = [...tasks]
      }
      else{
        if(this.state.taskIndex>=savedTask[0][new Date().getDay()].length){
          this.setState({taskIndex:0})
        }
        tasks = savedTask[0][new Date().getDay()]
      }
      
      if(first&&!needUpdate){
        tasks.forEach(element => {
          element.sortValue = this.updateSortValue(element)
          element.repeating = false;
        });
      }
      if(!this.resetOrder()){
        this.sortTask()
      }
      // this.selectTasks()
      // this.setState({ready:true})
      const jsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('tasks', jsonValue)
      console.log("task:")
      console.log(tasks)
    }catch(e) {
      
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  }

  async savedSetTasks(){
    try {
      const JsonValue = await AsyncStorage.getItem('firsty')
      var first = JsonValue != null ? JSON.parse(JsonValue) :true;
      const dayJsonValue = await AsyncStorage.getItem('day')
      var day = dayJsonValue != null ? JSON.parse(dayJsonValue) :null;
      var oldTasks=[]
      const savedTaskJsonValue = await AsyncStorage.getItem('setTasks')
      var savedTask = savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) :null;

      if(first){
        day = null;
        savedTask = null;
      }
      
      var needUpdate = false;
      //Set up savedTask
      if(savedTask == null){
        needUpdate = true
        savedTask = [new Array(7),new Array(7)]
        savedTask.forEach(element => {
          for (let i = 0; i < element.length; i++) {
            element[i] = []
          }
        });
      }
      //If it is a new day
      if (day != null&&new Date(new Date().setHours(0,0,0,0)).getTime()!=new Date(day).getTime()) {
        oldTasks = [...savedTask[0][new Date(day).getDay()]]
        //If it is a new week, set the week's tasks to the weekly ones
        if(new Date(new Date().setHours(0,0,0,0)).getTime()-new Date(day).getTime()>(new Date().getDay()-new Date(day).getDay())*1000*60*60*24){
          savedTask[0]=[...savedTask[1]]
        }

        //Shift due dates
        savedTask[0][new Date().getDay()].forEach(e => {
          if(e.repeating = true) 
          {
            var d = new Date().setHours(0,0,0,0)
            e.start = new Date().setHours(new Date(e.start).getHours(),new Date(e.start).getMinutes())
            e.end = new Date().setHours(new Date(e.end).getHours(),new Date(e.end).getMinutes())
          }
        });
        //Remove or edit recuring tasks
        for(let i=0;i<oldTasks.length;i++){
          var newIndex = savedTask[0][new Date().getDay()].findIndex((element)=>element.name==oldTasks[i].name)
          if(newIndex!=-1){
            oldTasks.splice(i,1)
            i--
          }
        }
        setTasks=oldTasks.concat(savedTask[0][new Date().getDay()])
        savedTask[0][new Date().getDay()] = [...setTasks]
      }
      else{
        if(this.state.taskIndex>=savedTask[0][new Date().getDay()].length){
          this.setState({taskIndex:0})
        }
        setTasks = savedTask[0][new Date().getDay()]
      }
      
      if(first&&!needUpdate){
        setTasks.forEach(element => {
          element.repeating = false;
        });
      }
      if(!this.resetOrder()){
        this.sortTimes()
      }
      // this.selectTasks()
      // this.setState({ready:true})
      const jsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('setTasks', jsonValue)
      console.log("setTasks:")
      console.log(setTasks)
    }catch(e) {
      
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  }

  updateSortValue(element){
    return parseInt(((new Date(element.date).getTime())/(1000*60*60))+(6-element.dueImportance)*2*(11-element.importance))+parseInt(element.length)/10
  }
  
  async changeDay(){
    try {
      const dayJsonValue = await AsyncStorage.getItem('day')
      var day = dayJsonValue != null ? JSON.parse(dayJsonValue) :null;
      if (day == null||new Date(new Date().setHours(0,0,0,0)).getTime()!=new Date(day).getTime()){
        day = new Date().setHours(0,0,0,0)
        // this.setState({ready:true})
        const jsonValue = JSON.stringify(day)
        await AsyncStorage.setItem('day', jsonValue)
      }
    }catch(e) {
      console.log(e)
    }
  }

  async getSelectable() {
    const JsonValue = await AsyncStorage.getItem('selectable')
    const JsonValueT = await AsyncStorage.getItem('sTask')
    selectable =  JsonValue != null ? JSON.parse(JsonValue) : true;
    if(!selectable){
      var test = JsonValueT != null ? JSON.parse(JsonValueT) : null;
    }
    this.setState({selectable:selectable})
    this.setState({sTask:test})
  }

  //Find day and time
  day(time){
    return Math.floor(new Date()/(60*1000*60*24))-Math.floor(new Date(time)/(60*1000*60*24))
  }
  
  time(t){
    return new Date(Math.floor(new Date(t)/(60*1000))*60*1000)
  }
  
  //Update setTasks based on current time
  sortSetTasks() {
    for(var i=0; i<=setTasks.length-1;i++){
      if(new Date(setTasks[i].end).getTime()<=Date.now()){
        setTasks.splice(i, 1)
      }
      else if(new Date(setTasks[i].start).getTime()<Date.now()){
        setTasks[i].start=this.time(Date.now())
      }
    }
  }

  //Combine tasks and setTasks
  makeCombined(){
    var setIndex = 0;
    var lastTask = new Date()
    combined = []
    this.sortSetTasks()
    if(tasks.length > 0||setTasks.length>0){
      var time = this.time(Date.now())
      
      if(this.state.selectable==false){
        if(combined[0].length-((this.time(new Date ())-this.time(combined[0].start))/(1000*60))>0){
          combined[0].length -= ((this.time(new Date ())-this.time(combined[0].start))/(1000*60))
        }
        else{
          combined[0].length = 10
        }
      }
      for (var i = 0; i <=tasks.length-1; i++){
        if (setIndex<setTasks.length-1||(setIndex==0&&this.time(time).getTime()<this.time(setTasks[setIndex].start).getTime()))
        { 
          if (this.time(time).getTime()==this.time(setTasks[setIndex].start).getTime())
          {
            //Add set task
            console.log("Add set task")
            time=setTasks[setIndex].end;
            combined.push({...setTasks[setIndex]})
            setIndex++;
          }
          if (tasks[i].length<=Math.round((this.time(setTasks[setIndex].start).getTime()-this.time(time).getTime())/(1000*60)))
          {
            //Task length <= time until set task -> add task
            console.log("Task length <= time until set task -> add task")
            tasks[i].start = time
            tasks[i].end = this.time(new Date(time).getTime()+tasks[i].length*1000*60)
            combined.push({...tasks[i]})
          }
          else
          {
            //Split Task
            console.log("Split Task")
            tasks[i].start = time
            tasks[i].end = this.time(setTasks[setIndex].start)
            combined.push({...tasks[i]})
            tasks.splice(i+1,0,{...tasks[i]})
            tasks[i+1].length -= (this.time(setTasks[setIndex].start)-this.time(time))/(1000*60)
            if(!(tasks[i].name.substring(tasks[i].name.length-8)==" (cont.)")){
              tasks[i+1].name = tasks[i].name + " (cont.)"
            }
          }
        }
        else if(setIndex==setTasks.length-1){
          console.log("last setTask")
          time=setTasks[setIndex].end;
          combined.push({...setTasks[setIndex]})
          setIndex++
        }
        if(setIndex==setTasks.length){
          //no more set tasks -> Add task
          console.log("no more set tasks -> Add task")
          tasks[i].start = time
          tasks[i].end = this.time(this.time(time).getTime()+tasks[i].length*1000*60)
          combined.push({...tasks[i]})
        }
        lastTask = tasks[i].end
        time = tasks[i].end
        if(i>0&&tasks[i].name.substring(tasks[i].name.length-8)==" (cont.)"){
          tasks.splice(i, 1)
          i-=1
        }
      }
      //Add remaining setTasks
      for(setIndex;setIndex<setTasks.length;setIndex++){
        console.log("Add remaining setTasks")
        combined.push({...setTasks[setIndex]})
      }
    }
    if(setTasks.length>0){
      this.availableTime = this.time(setTasks[setTasks.length-1].end)-this.time(lastTask)
    }
    else{
      this.availableTime = this.time(Date.now())-this.time(lastTask)
    }
    console.log("combined:")
    console.log(combined)
    this.setState({ready:true})
    return combined
    
  }

  renderItem(item, index, drag, isActive){
    // console.log(item.index)
    // console.log(this.state.taskIndex)
    // console.log((item.index === this.state.taskIndex))
    // console.log(combined[item.index].name)
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={item.item.sortValue!=null?drag:null}
          onPress={() => this.setState({taskIndex:item.index})}
          style={this.state.taskIndex==combined.findIndex((element)=>element.name==item.item.name)?[styles.tasks,{backgroundColor:'#6163c7'}]:styles.tasks}
        >
          <Text style={this.state.taskIndex==combined.findIndex((element)=>element.name==item.item.name)?{ fontSize: 17, alignSelf: 'center',fontWeight: 'bold', color:'#fff' }:{ fontSize: 17, alignSelf: 'center', color:'#fff' }}>{item.item.name}</Text>
          <Text style={this.state.taskIndex==combined.findIndex((element)=>element.name==item.item.name)?{ fontSize: 12, alignSelf: 'center',fontWeight: 'bold', color: '#fff' }:{ fontSize: 12, alignSelf: 'center', color: '#fff'}}>{this.displayTime(item.item.start)+' - '+this.displayTime(item.item.end)}</Text>
          
          {item.item.sortValue!=null?<Text style={this.state.taskIndex==combined.findIndex((element)=>element.name==item.item.name)?{ fontSize: 12, alignSelf: 'center',fontWeight: 'bold', color: '#fff' }:{ fontSize: 12, alignSelf: 'center', color: '#fff'}}>{' (Due: '+this.displayDate(item.item.date)+' '+this.displayTime(item.item.date)+')'}</Text>:null}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  startDrag(index){
    if(combined[index].sortValue != null){
      for(i=0;i<combined.length;i++){
        if(combined[i].name + " (cont.)"== combined[index].name||combined[i].name== combined[index].name+" (cont.)"||combined[i].name== combined[index].name){
          combined.splice(i,1)
        }
      }
    }
    this.setState({ready:true})
  }

  setData(data,to){
    for(i=to-1;i>=0;i--){
      if(data[i].sortValue!=null){
        tasks.remove(data[to])
        tasks.splice(tasks.indexOf(data[i])+1,0,data[to])
        this.makeCombined()
        return
      }
    }
    tasks.splice(0,0,data[to])
    this.makeCombined()
  }

  //Task controls
  start(){
    if(setTasks.length==0||(setTasks.length>0&&Date.now()<this.time(setTasks[0].start).getTime())){
      console.log("in")
      this.setState({selectable:false})
      var selectedTask = tasks[this.state.taskIndex]
      tasks.splice(this.state.taskIndex, 1)
      this.setState({taskIndex: 0})
      tasks.splice(0, 0, selectedTask)
      tasks[0].start=Date.now()
      this.saveTasks()
      this.saveSelectable()
      this.setState({ready:true, selectable:false})
    }
  }

  pause(){
    this.setState({ready:true,selectable:true})
    tasks[0].sortValue=this.updateSortValue(tasks[0])
    this.saveTasks()
    this.removeSelectable()
  }

  stop(){
    Alert.alert(
      'Are you sure?',
      "This action is irreversable and your task will be deleted.",
      [
        { text: 'Cancel',style:"cancel"},
        {text:'Continue',onPress: ()=>this.remove()}
      ],
      { cancelable: true }
      
    )
  }

  remove(){
    this.removeSelectable()
    if(combined[this.state.taskIndex].sortValue!=null){
      tasks.splice(this.state.taskIndex,1)
    }
    else{
      setTasks.splice(this.state.taskIndex,1)
    }
    this.saveTasks()
    this.setState({taskIndex:0,selectable:true, ready:true})
  }

  //Store selectable(working on task) status
  async saveSelectable(){
    try {
      const jsonValue = JSON.stringify(false)
      await AsyncStorage.setItem('selectable',jsonValue)
      const sTjsonValue = JSON.stringify(tasks[this.state.taskIndex])
      await AsyncStorage.setItem('sTask',sTjsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  async removeSelectable(){
    try {
      const jsonValue = JSON.stringify(true)
      await AsyncStorage.setItem('selectable',jsonValue)
      const sTjsonValue = JSON.stringify(null)
      await AsyncStorage.setItem('sTask',sTjsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  //Save tasks
  async saveTasks(){
    try {
      const savedTaskJsonValue = await AsyncStorage.getItem('tasks')
      var savedTask =  savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) :null;
      savedTask[0][new Date().getDay()]=[...tasks]
      const jsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('tasks', jsonValue)
      const savedSetTaskJsonValue = await AsyncStorage.getItem('setTasks')
      var savedTask =  savedSetTaskJsonValue != null ? JSON.parse(savedSetTaskJsonValue) :null;
      savedTask[0][new Date().getDay()]=[...tasks]
      const setJsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('setTasks', jsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  //Sort tasks
  sortTask(){
    tasks.sort(function(a, b){return a.sortValue - b.sortValue});
    this.selectTasks()
    this.setState({ready:true})
  }

  sortTimes(){
    setTasks.sort(function(a, b){return new Date(a.start).getTime() - new Date(b.start).getTime()});
    this.setState({ready:true})
  }


  selectTasks(){
    if(this.state.sTask!=null){
      tasks.splice(tasks.findIndex((element)=>element.name==this.state.sTask.name),1)
      tasks.splice(0,0,this.state.sTask);
      this.setState({sTask:null});
    }
  }

  //Get task information
  displayTime(date){
    var hours = new Date(date).getHours()
    var minutes = new Date(date).getMinutes()
    var amPm = ' am'
    if(hours>=12){
      amPm=' pm'
    }
    if(hours==0){
      hours=12
    }
    if(hours>12){
      hours -= 12
    }
    if(minutes<10){
      return hours+':'+'0'+minutes+amPm
    }
    return hours+':'+minutes+amPm
  }

  displayDate(date) {
    var month = new Date(date).getMonth()+1
    var day = new Date(date).getDate()
    return month+"/"+day
  }

  taskName(){
    if(combined.length > 0){
      // console.log(this.state.taskIndex)
      return combined[this.state.taskIndex].name
    }
    return 'Add a Task'
  }

  //Editing
  async editTask(){
    try {
      const jsonValue = JSON.stringify(combined[this.state.taskIndex].name)
      await AsyncStorage.setItem('editName', jsonValue)
      if(combined[this.state.taskIndex].sortValue!=null){
        this.props.navigation.navigate('AddTask')
      }
      else{
        this.props.navigation.navigate('AddWorkTime')
      }
    } catch (e) {
      Alert.alert('Error getting task edit info!','Failed to get task edit info! Please try again.')
      console.log(e)
    }
  }


  //Find time left
  findavailableTime(){
    var timeLeft = this.availableTime/(60*1000)
    if(timeLeft>10){
      return <Text style={{fontSize:15, color:'black' }}>{timeLeft} minutes available to use</Text>
    }
    else if(timeLeft>=0){
      return <Text style={{fontSize:15,color: 'orange' }}>{timeLeft} minutes available to use</Text>
    }
    else{ 
      return <Text style={{fontSize:15,color: 'red' }}>{-timeLeft} more minutes needed to finish tasks!</Text>
    }
   
  }

  resetOrder(){
    var temp = tasks.sort(function(a, b){return a.sortValue - b.sortValue});
    for(i=0;i<tasks.length;i++){
      if(!(tasks[i].name==temp[i].name)){
        return true
      }
    }
    return false
  }

  render(){
    const { navigate } = this.props.navigation;
    if(!this.state.ready){
      return null
    }
    return (
      
      <SafeAreaView style={styles.container}>

        <Overlay isVisible={this.state.firstTime} onBackdropPress={()=>this.setState({firstTime:false})}>
          <SafeAreaView style = {styles.container}>
        
            <ScrollView style={{height:'100%'}}>
              {/* <View style={{flex:1,justifyContent:'center'}}> */}
            <Text style={{ fontSize: 28, alignSelf: 'center' }}>Welcome to CheckMate!</Text>
            <Text style={{fontSize:23, alignSelf: 'center'}}>Instructions:{"\n"}</Text>
            <Text style={{fontSize:17,padding:5}}>
  1. Add tasks by clicking the "Add Task" button at the top of the screen and then filling out the parameters that follow. You can set your tasks to be also used on other days in the "use for" section.{"\n\n"}
  2. Add work times (times your available to work) by clicking the "Add setTasks" button at the top of the screen and then filling out the start and end times. Just like for tasks, you can set your work times to be also used on other days in the "use for" section.{"\n\n"}
  3. Back on the home page, select a task by clicking on it.{"\n\n"}
  4. During your work times, play, pause and finish the selected task by clicking the buttons on the bottom of the page.{"\n\n"}
  5. Repeat{"\n\n"}
  6. Be productive!{"\n\n"}</Text>
            <Button
              containerStyle = {{justifyContent:"flex-end"}}
              title = "Close"
              raised = {true}
              onPress={()=>this.setState({firstTime:false,ready:true})}
            />
            {/* </View> */}
            </ScrollView>
          </SafeAreaView>
        </Overlay>

        <View style={{flex:9}}>
        <View style={styles.top}> 
          {/* Adding Display */}
          <View style={{position: 'absolute', left: 0, padding:10}}>
            <Icon 
              name="question-circle" 
              type='font-awesome-5' 
              size = {25}
              onPress={()=>this.setState({firstTime:true})}
            />
          </View>
          <TouchableOpacity style={{flexDirection:'row', backgroundColor:'#152075', marginRight:7, padding:5, borderRadius:5}} onPress={() =>navigate('AddTask')}>   
            <Icon name="plus-circle" color='#fff' size={20} type="feather"/>
            <View style={{alignItems: 'center',marginHorizontal:5}}>
              <Text style={{ fontSize: 13, color: '#fff' }}>Add</Text>
              <Text style={{ fontSize: 13, color: '#fff' }}>Task</Text>
            </View>
          </TouchableOpacity>    
          <TouchableOpacity style={{flexDirection:'row', backgroundColor:'#152075', padding:5, borderRadius:5}} onPress={() =>navigate('AddWorkTime')}>
          <Icon name="clock" color='#fff' size={20} type="feather"/> 
          <View style={{alignItems: 'center',marginHorizontal:5}}>
            <Text style={{ fontSize: 13, color: '#fff' }}>Add</Text>
            <Text style={{ fontSize: 13, color: '#fff'}}>setTasks</Text>
          </View>
          </TouchableOpacity>
        </View>
        <View style={{flex:8}}>
            <DraggableFlatList
              data={combined}
              onDragBegin = {({index})=>this.startDrag(index)}
              onDragEnd={({ data, to }) => this.setData(data, to)}
              keyExtractor={(item) => item.name}
              renderItem={(item,index,drag,isActive)=>this.renderItem(item,index,drag,isActive)}
            />
              
            {/* Reset order display */}
            <View style={{padding:8}}>
              {this.resetOrder()?
              <TouchableOpacity onPress={() => this.sortTask()} style={[styles.button,{flex:1}]}>
              <Text style={{ fontSize: 20, color: '#fff' }}>Reset Order</Text>
            </TouchableOpacity>
            :null}
            </View>
          
        </View>

        {/* Task in progress overlay */}
        {this.state.selectable==false? <View style={styles.grayOverlay}/>:null}
        </View>
        <Divider style={{ backgroundColor: 'gray' }} />

        {/* Task controls display */}
        <View style={styles.selectView}>
          <View style={styles.inSelection}>
            <Text style={{ fontSize: 20}}>{this.taskName()}</Text>
            <Icon color={this.state.selectable==false||combined.length==0?'gray':'black'} name="pencil-alt" type='font-awesome-5' onPress={this.state.selectable==false||combined.length==0?null:() => this.editTask()}/>
          </View>
          <View style={styles.inSelection}>
          {this.state.selectable==true?<Icon name="play" type='font-awesome-5' size={25} color={combined.length>0?'limegreen':'gray'} onPress={combined.length>0&&combined[this.state.taskIndex].sortValue!=null?() => this.start(): null}></Icon>:<Icon name="pause" size={30} type='font-awesome-5' color={'#FFCC00'} onPress={() => this.pause()}/>}
            
            <Icon name="stop" type='font-awesome-5'color={combined.length>0?'red':'gray'} size={25} onPress={combined.length>0?() => this.stop():null}/>
          </View>
          <View style={{flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around',padding:3}}>
            {this.findavailableTime()}
          </View>
        </View>
      </SafeAreaView>
    );
    
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    flexDirection: 'column'
  },
  top: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    flex: 1,
    padding: 8
  },
  button: {
    backgroundColor: "#3C00BB",
    padding: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  grayOverlay: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor:'gray',
    opacity:.5,
    top:0,
    height:'100%',
    width:'100%',
  },
  topButton: {
    backgroundColor: "#3C00BB",
    padding: 8,
    borderRadius: 6,
  },
  tasks:{
    backgroundColor: "#152075",
    padding: 5,
    borderColor:'#a6a6a6',
    borderWidth: 2,
    borderBottomWidth:0,
  },
  overTasks:{
    backgroundColor: "#AAAFB4",
    padding: 5,
    borderColor:'#a6a6a6',
    borderWidth: 2,
    borderBottomWidth:0,
  },
  setTasks: {
    flex: 1,
    backgroundColor: "#152075",
    padding: 8,
    flexDirection: 'row',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  selectView: {
    flex: 2.3,
    padding: 3,
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  inSelection: {
    flex: 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  }
});
