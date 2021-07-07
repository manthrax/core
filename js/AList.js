
let addToSet = (obj,list,field)=>{
    if (obj[field] !== undefined)
        return
    obj[field] = list.length
    list.push(obj);
}
let removeFromSet = (obj,list,field)=>{
    if (obj[field] === undefined)
        return;
    let top = list.pop()
    if (obj[field] < list.length) {
        top[field] = obj[field];
        list[obj[field]] = top;
    }
    delete obj[field]
}

export {addToSet,removeFromSet}