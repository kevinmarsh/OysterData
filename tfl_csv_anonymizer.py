#!/usr/bin/python

import csv
import datetime
import random
import string
import sys

def anonymize_tfl_data(csvfile):
    """
        Takes a CSV from TFL of all of your journeys taken with an oyster card
        and out creates an annnoymized CSV files obscuring the times and
        locations while still allowing sensible times, locations and prices to
        make sense for aggregation

        WARNING: this is a very poor anonymizer and anyone with the time could
                 possibly be able to work out which station was which
    """
    with open(csvfile, 'r') as csvinput:
        with open('sample_tfl_data.csv', 'w') as csvoutput:
            writer = csv.writer(csvoutput, lineterminator='\n')

            str_format_date = '%d-%b-%Y'
            str_format_time = '%H:%M'
            str_format = ','.join([str_format_date, str_format_time])

            def alias_count_generator():
                for letter in string.uppercase:
                     for number in range(1,10):
                         yield '%s%s' % (letter, number)

            def journey_aliased(place, pre='Station'):
                if place not in journery_aliases:
                    journery_aliases[place] = '%s %s' % (pre, alias_count.next())
                return journery_aliases[place]

            alias_count = alias_count_generator()
            journery_aliases = {
                '[No touch-in]' : '[No touch-in]',
                '[No touch-out]' : '[No touch-out]',
            }
            balance_diff = random.randint(0,2000)/100.0

            for row in csv.reader(csvinput):
                try:
                    start_time = datetime.datetime.strptime(row[0] + ',' + row[1], str_format)
                except (ValueError, IndexError):
                    writer.writerow(row)
                    continue

                end_time = datetime.datetime.strptime(row[0] + ',' + row[2], str_format) if row[2] else None
                time_diff = datetime.timedelta(seconds=(60 * random.randint(0, 60*24)))
                start_time += time_diff
                row[0] = start_time.strftime(str_format_date)
                row[1] = start_time.strftime(str_format_time)
                if end_time:
                    end_time += time_diff
                    row[2] = end_time.strftime(str_format_time)

                if len(row[3].split(' to ')) == 2:
                    row[3] = ' to '.join( journey_aliased(place) for place in row[3].split(' to ') )
                elif len(row[3].split(', ')) == 2:
                    action, place = row[3].split(', ')
                    place_pre = 'route' if action == 'Bus journey' else 'Station'
                    row[3] = ', '.join([action, journey_aliased(place, place_pre)])
                else:
                    # Must be 'Entered and exited'
                    row[3] = 'Entered and exited ' + journey_aliased(row[3][len('Entered and exited '):])

                row[6] = '%.2f' % (float(row[6]) + balance_diff)

                writer.writerow(row)

if __name__ == '__main__' and len(sys.argv) == 2:
    anonymize_tfl_data(sys.argv[1])
