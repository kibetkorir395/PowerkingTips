import SliderItem from './SliderItem'
import './Slider.scss';

export default function Slider({data}) {

  return (
    <div className='slider'>
      {
        data.map(item => {
          return <SliderItem data={item} key={data.indexOf(item)}/>
        })
      }
    </div>
  )
}
